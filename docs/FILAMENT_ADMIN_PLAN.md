# Plan: Panel de Administración con Filament para GreenNode

## Resumen
Crear un panel de administración con Filament v3 dentro del proyecto GreenNode React Native, ubicado en la carpeta `admin/`. El panel administrará: Contenedores, Clasificaciones de residuos, y Depósitos.

## Prerrequisitos del Sistema
- **PHP:** 8.4.12 ✓ (instalado)
- **Composer:** 2.8.11 ✓ (instalado)
- **MySQL:** No instalado → Se instalará via Homebrew
- **Node.js:** Requerido para assets de Filament

---

## Fase 1: Instalación de MySQL

```bash
# Instalar MySQL
brew install mysql

# Iniciar servicio
brew services start mysql

# Seguridad inicial (establecer root password)
mysql_secure_installation

# Crear base de datos
mysql -u root -p -e "CREATE DATABASE greennode_admin;"
```

---

## Fase 2: Crear Proyecto Laravel

```bash
# Crear proyecto Laravel en carpeta admin/
cd /Users/jonathanbernate/Documents/GitHub/Green_Node
composer create-project laravel/laravel admin

# Configurar .env con MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=greennode_admin
DB_USERNAME=root
DB_PASSWORD=<password>

# Verificar conexión
php artisan migrate
```

---

## Fase 3: Instalar Filament v3

```bash
# Instalar Filament
composer require filament/filament:"^3.3" -W

# Instalar panel
php artisan filament:install --panels

# Crear usuario admin
php artisan make:filament-user
```

---

## Fase 4: Modelos y Migraciones

### 4.1 Modelo: Container (Contenedor)

```bash
php artisan make:model Container -m
```

**Migración:**
```php
Schema::create('containers', function (Blueprint $table) {
    $table->id();
    $table->string('identifier');          // ID único del contenedor
    $table->string('address');             // Dirección/ubicación
    $table->decimal('latitude', 10, 8);    // Latitud GPS
    $table->decimal('longitude', 11, 8);   // Longitud GPS
    $table->enum('waste_type', ['organic', 'plastic', 'paper', 'glass', 'metal', 'special']);
    $table->integer('capacity_kg');        // Capacidad en kg
    $table->integer('current_level_kg')->default(0); // Nivel actual
    $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
    $table->timestamp('last_collected_at')->nullable(); // Última recolección
    $table->timestamps();
    $table->softDeletes();
});
```

**Modelo:**
```php
class Container extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'identifier', 'address', 'latitude', 'longitude',
        'waste_type', 'capacity_kg', 'current_level_kg',
        'status', 'last_collected_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'last_collected_at' => 'datetime',
    ];

    public function classifications() { return $this->hasMany(Classification::class); }
    public function deposits() { return $this->hasMany(Deposit::class); }

    public function getFillLevelPercentAttribute(): float
    {
        return $this->capacity_kg > 0
            ? round(($this->current_level_kg / $this->capacity_kg) * 100, 1)
            : 0;
    }

    public function getFillLevelCategoryAttribute(): string
    {
        $pct = $this->fill_level_percent;
        return match(true) {
            $pct >= 90 => 'critical',
            $pct >= 70 => 'high',
            $pct >= 40 => 'medium',
            default => 'low',
        };
    }
}
```

### 4.2 Modelo: Classification (Clasificación)

```bash
php artisan make:model Classification -m
```

**Migración:**
```php
Schema::create('classifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('container_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('waste_type', ['organic', 'plastic', 'paper', 'glass', 'metal', 'special']);
    $table->decimal('confidence', 5, 4);  // 0.0000 - 1.0000
    $table->string('image_path')->nullable(); // Ruta de la imagen
    $table->boolean('user_confirmed')->default(true);
    $table->enum('source', ['ai', 'manual'])->default('ai');
    $table->timestamps();
});
```

**Modelo:**
```php
class Classification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'container_id', 'waste_type', 'confidence',
        'image_path', 'user_confirmed', 'source',
    ];

    protected $casts = [
        'confidence' => 'decimal:4',
        'user_confirmed' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function container() { return $this->belongsTo(Container::class); }
    public function deposits() { return $this->hasMany(Deposit::class); }

    public function getWasteTypeLabelAttribute(): string
    {
        return match($this->waste_type) {
            'organic' => 'Orgánico',
            'plastic' => 'Plástico',
            'paper' => 'Papel',
            'glass' => 'Vidrio',
            'metal' => 'Metal',
            'special' => 'Residuo Especial',
        };
    }
}
```

### 4.3 Modelo: Deposit (Depósito)

```bash
php artisan make:model Deposit -m
```

**Migración:**
```php
Schema::create('deposits', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('classification_id')->constrained()->cascadeOnDelete();
    $table->foreignId('container_id')->nullable()->constrained()->nullOnDelete();
    $table->decimal('weight_kg', 8, 3)->nullable();
    $table->integer('points_earned')->default(0);
    $table->boolean('classification_correct')->nullable(); // Feedback del usuario
    $table->timestamps();
});
```

**Modelo:**
```php
class Deposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'classification_id', 'container_id',
        'weight_kg', 'points_earned', 'classification_correct',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:3',
        'classification_correct' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function classification() { return $this->belongsTo(Classification::class); }
    public function container() { return $this->belongsTo(Container::class); }
}
```

### 4.4 Modelo: User (actualizar existente)

Agregar relaciones al modelo User existente:
```php
public function classifications() { return $this->hasMany(Classification::class); }
public function deposits() { return $this->hasMany(Deposit::class); }
```

---

## Fase 5: Recursos Filament

### 5.1 ContainerResource

```bash
php artisan make:filament-resource Container --generate --soft-deletes
```

**Formulario:**
- TextInput: identifier (requerido, searchable)
- TextInput: address (requerido)
- TextInput: latitude (requerido, numeric)
- TextInput: longitude (requerido, numeric)
- Select: waste_type (organic, plastic, paper, glass, metal, special)
- TextInput: capacity_kg (requerido, numeric)
- TextInput: current_level_kg (numérico, default 0)
- Select: status (active, inactive, maintenance)
- DateTimePicker: last_collected_at

**Tabla:**
- Columnas: identifier, address, waste_type (badge), fill_level_percent (badge color-coded), status (badge), last_collected_at
- Filtros: waste_type, status
- Acciones: view, edit, delete
- Bulk actions: delete, deactivate

### 5.2 ClassificationResource

```bash
php artisan make:filament-resource Classification --generate
```

**Formulario:**
- Select: user_id (relationship)
- Select: container_id (relationship, nullable)
- Select: waste_type (organic, plastic, paper, glass, metal, special)
- TextInput: confidence (numeric, 0-1)
- FileUpload: image_path (imagen, nullable)
- Toggle: user_confirmed
- Select: source (ai, manual)

**Tabla:**
- Columnas: id, user.name, waste_type_label (badge), confidence (percentage), source (badge), created_at
- Filtros: waste_type, source, user
- Acciones: view, delete
- Bulk actions: delete

### 5.3 DepositResource

```bash
php artisan make:filament-resource Deposit --generate
```

**Formulario:**
- Select: user_id (relationship)
- Select: classification_id (relationship)
- Select: container_id (relationship, nullable)
- TextInput: weight_kg (numeric, nullable)
- TextInput: points_earned (numérico)
- Toggle: classification_correct (nullable)

**Tabla:**
- Columnas: id, user.name, classification.waste_type, container.identifier, weight_kg, points_earned, classification_correct (badge), created_at
- Filtros: classification_correct, user
- Acciones: view, delete
- Bulk actions: delete

---

## Fase 6: Configuración del Panel

### 6.1 AdminPanelProvider

Personalizar `app/Providers/Filament/AdminPanelProvider.php`:

```php
public function panel(Panel $panel): Panel
{
    return $panel
        ->default()
        ->id('admin')
        ->path('admin')
        ->login()
        ->colors([
            'primary' => Color::Emerald,
        ])
        ->navigationGroups([
            NavigationGroup::make()->label('Gestión'),
            NavigationGroup::make()->label('Sistema'),
        ])
        ->widgets([
            \App\Filament\Widgets\StatsOverview::class,
        ])
        ->pages([
            \Filament\Pages\Dashboard::class,
        ]);
}
```

### 6.2 Widget: StatsOverview

Crear widget con estadísticas:
- Total de contenedores
- Clasificaciones hoy
- Depósitos hoy
- Nivel promedio de llenado

---

## Fase 7: Estructura Final del Proyecto

```
Green_Node/
├── admin/                          # ← NUEVO: Proyecto Laravel + Filament
│   ├── app/
│   │   ├── Models/
│   │   │   ├── Container.php
│   │   │   ├── Classification.php
│   │   │   ├── Deposit.php
│   │   │   └── User.php
│   │   ├── Filament/
│   │   │   ├── Resources/
│   │   │   │   ├── ContainerResource.php
│   │   │   │   ├── ClassificationResource.php
│   │   │   │   └── DepositResource.php
│   │   │   └── Widgets/
│   │   │       └── StatsOverview.php
│   │   └── Providers/
│   │       └── Filament/
│   │           └── AdminPanelProvider.php
│   ├── database/
│   │   └── migrations/
│   │       ├── create_containers_table.php
│   │       ├── create_classifications_table.php
│   │       └── create_deposits_table.php
│   ├── .env
│   └── ...
├── src/                            # React Native app (existente)
├── admin/                          # Laravel + Filament (nuevo)
└── docs/
    └── FILAMENT_ADMIN_PLAN.md
```

---

## Fase 8: Verificación

1. Ejecutar migraciones: `php artisan migrate`
2. Crear usuario admin: `php artisan make:filament-user`
3. Iniciar servidor: `php artisan serve`
4. Acceder a: `http://localhost:8000/admin`
5. Verificar CRUD de cada recurso

---

## Comandos Resumen

```bash
# Fase 1: MySQL
brew install mysql
brew services start mysql
mysql_secure_installation
mysql -u root -p -e "CREATE DATABASE greennode_admin;"

# Fase 2: Laravel
cd /Users/jonathanbernate/Documents/GitHub/Green_Node
composer create-project laravel/laravel admin

# Fase 3: Filament
cd admin
composer require filament/filament:"^3.3" -W
php artisan filament:install --panels
php artisan make:filament-user

# Fase 4: Modelos
php artisan make:model Container -m
php artisan make:model Classification -m
php artisan make:model Deposit -m

# Fase 5: Recursos Filament
php artisan make:filament-resource Container --generate --soft-deletes
php artisan make:filament-resource Classification --generate
php artisan make:filament-resource Deposit --generate

# Fase 6: Migrar y probar
php artisan migrate
php artisan serve
```

---

## Notas

- El panel de administración es independiente de la app React Native
- Comparte la misma base de datos si se desea (para sync futuro)
- Filament incluye: autenticación, formularios, tablas, notificaciones, widgets
- URL del admin: `http://localhost:8000/admin`
