# Instrucciones para GitHub Copilot - Proyecto Novedat Core (Java)

## 🚨 REGLAS CRÍTICAS - LEER PRIMERO

### 📌 PRIORIDAD DE LECTURA (Orden de Importancia):
1. 🤖 **AUTOVALIDACIÓN OBLIGATORIA** (líneas 19-179) - Validar TODO código antes de generarlo
2. 🔍 **COMANDOS ESPECIALES** (líneas 181-336) - Protocolo "validar aberrancia"
3. 📊 **LÍMITES Y MÉTRICAS** (líneas 337+) - Límites obligatorios BlueOptima

## 🎯 Objetivo Principal: Reducir Aberrancia (BlueOptima)

Este proyecto Java es evaluado por **BlueOptima** para medir productividad y calidad de código. La prioridad es **minimizar la aberrancia** en todas las contribuciones de código.

**TODO código generado, explicado o corregido debe tener aberrancia ≤ 5.5/100**

---

## 🤖 AUTOVALIDACIÓN OBLIGATORIA DE CÓDIGO GENERADO

**REGLA CRÍTICA: TODO CÓDIGO QUE GENERES DEBE TENER ABERRANCIA ≤ 5.5/100**

### Checklist PRE-generación (validar ANTES de proponer código):

| Criterio | Límite | Validación |
|----------|--------|------------|
| Complejidad ciclomática | ≤ 5 | ¿Caminos de ejecución? |
| Líneas por método | ≤ 30 | ¿Método conciso? |
| Estilo moderno | Java 8+ | ¿Streams, Optional, method refs? |
| Duplicación | 0% | ¿DRY aplicado? |
| Nombres | Descriptivos | ¿Auto-explicativos en inglés? |
| Código muerto | 0 líneas | ¿Sin comentarios/código viejo? |
| Formato | Estándar | ¿Sin espacios extras? |
| Null safety | 100% | ¿Usa Optional o validaciones? |

### Preferencias OBLIGATORIAS para Java:

1. ✅ **Streams API** > loops tradicionales (cuando sea legible)
2. ✅ **Method references** > lambdas: `String::isEmpty` NO `s -> s.isEmpty()`
3. ✅ **Optional<T>** > null returns o null checks
4. ✅ **Immutability** > mutabilidad (final, Collections.unmodifiableX)
5. ✅ **`chars()`/`codePoints()`** > `toCharArray()`
6. ✅ **Early returns** > anidación profunda
7. ✅ **API pública documentada** con JavaDoc completo
8. ✅ **Validaciones en constructores** y métodos públicos
9. ✅ **Try-with-resources** > try-catch-finally manual
10. ✅ **Constructor injection** > field injection

### Ejemplos - CÓDIGO ACEPTABLE (aberrancia ≤ 5.5/100):

```java
// ✅ EXCELENTE (3/100) - Streams, method reference, conciso
public boolean containsAtLeastOneLetter(String value) {
    return value != null && !value.isEmpty() && value.chars().anyMatch(Character::isLetter);
}

// ✅ EXCELENTE (4/100) - Optional, API clara, validaciones
public Optional<User> findUserById(Long id) {
    Objects.requireNonNull(id, "id cannot be null");
    
    return userRepository.findById(id);
}

// ✅ EXCELENTE (5/100) - Try-with-resources, logging, early return
@Slf4j
public class FileProcessor {
    
    public Optional<String> readFile(Path filePath) {
        Objects.requireNonNull(filePath, "filePath cannot be null");
        
        if (!Files.exists(filePath)) {
            log.warn("File does not exist: {}", filePath);
            return Optional.empty();
        }
        
        try (BufferedReader reader = Files.newBufferedReader(filePath)) {
            return Optional.of(reader.lines()
                .collect(Collectors.joining("\n")));
        } catch (IOException e) {
            log.error("Failed to read file: {}", filePath, e);
            return Optional.empty();
        }
    }
}

// ✅ EXCELENTE (5/100) - Immutable, bien documentado, validaciones
/**
 * Represents an immutable user configuration.
 * This class is thread-safe.
 *
 * @since 1.0.0
 */
public final class UserConfig {
    private final String username;
    private final List<String> roles;
    
    public UserConfig(String username, List<String> roles) {
        this.username = Objects.requireNonNull(username, "username cannot be null");
        this.roles = Collections.unmodifiableList(new ArrayList<>(
            Objects.requireNonNull(roles, "roles cannot be null")
        ));
    }
    
    public String getUsername() {
        return username;
    }
    
    public List<String> getRoles() {
        return roles;
    }
}
```

### Ejemplos - CÓDIGO RECHAZADO (aberrancia > 45/100) - NUNCA GENERAR:

```java
// ❌ MALO (60/100) - Loop tradicional, verboso, imperativo
public boolean containsAtLeastOneLetter(String value) {
    if (value == null || value.isEmpty()) {
        return false;
    }
    
    for (char c : value.toCharArray()) {  // ❌ Usar chars().anyMatch()
        if (Character.isLetter(c)) {
            return true;
        }
    }
    
    return false;
}

// ❌ MALO (70/100) - Null return, sin validaciones
public User findUserById(Long id) {
    if (id == null) return null;  // ❌ Usar Optional
    
    User user = userRepository.findById(id);
    if (user == null) {
        return null;
    }
    return user;
}

// ❌ MALO (75/100) - Sin try-with-resources, printStackTrace
public String readFile(String path) {
    BufferedReader reader = null;  // ❌ Usar try-with-resources
    try {
        reader = new BufferedReader(new FileReader(path));
        String line;
        StringBuilder content = new StringBuilder();
        while ((line = reader.readLine()) != null) {
            content.append(line);
        }
        return content.toString();
    } catch (Exception e) {
        e.printStackTrace();  // ❌ Usar logging apropiado
        return null;
    } finally {
        if (reader != null) {
            try {
                reader.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### Protocolo de Autovalidación:

1. **Genera mentalmente** el código
2. **Calcula aberrancia estimada** (0-100)
3. **Si > 5.5/100**: Refactorizar ANTES de proponer
4. **Si ≤ 5.5/100**: Proponer código
5. **Si no puedes lograr ≤ 5.5/100**: Explicar limitaciones y sugerir alternativas

**COMPROMISO: Es mejor NO generar código que generar código con alta aberrancia.**

---

## 🔍 COMANDOS ESPECIALES - INSTRUCCIONES OBLIGATORIAS

### Comando: "validar aberrancia" / "evaluar aberrancia"

**CUANDO EL USUARIO USE ESTOS TÉRMINOS, EJECUTAR EL SIGUIENTE PROTOCOLO:**

1. **Identificar el archivo actual** en el contexto del editor
2. **Obtener cambios sin commitear** ejecutando:
   ```bash
   git diff <archivo>
   ```
3. **Si no hay cambios locales**, ejecutar:
   ```bash
   git diff HEAD~1 HEAD -- <archivo>
   ```
   para comparar con el último commit

4. **Analizar ÚNICAMENTE los cambios** (diff), no todo el archivo

5. **Evaluar aberrancia de 0 a 100** donde:
   - **0-5.5**: ✅ Excelente (código de alta calidad, estándar empresa)
   - **5.6-13**: 🟢 Bueno (calidad aceptable, mejoras menores)
   - **13.1-25**: 🟡 Aceptable (algunos code smells, refactorizar pronto)
   - **25.1-45**: 🟠 Problemático (refactorización requerida)
   - **45.1-100**: 🔴 Crítico (bugs, anti-patterns, NO desplegar)

6. **Desglosar la evaluación** en una tabla con estos criterios:

| Aspecto | Aberrancia % | Peso | Puntos | Observación |
|---------|--------------|------|--------|-------------|
| Lógica Funcional | X% | 40% | X.X | Bugs, errores lógicos |
| Code Smells | X% | 25% | X.X | Malos olores de código |
| Anti-patterns | X% | 20% | X.X | Patrones incorrectos |
| Convenciones | X% | 10% | X.X | Estándares de código |
| Formato | X% | 5% | X.X | Estilo, indentación |

7. **Listar aberrancias específicas** encontradas:
   - 🔴 **CRÍTICA**: Errores que causan bugs o fallos
   - 🟠 **ALTA**: Problemas graves de diseño o performance
   - 🟡 **MEDIA**: Code smells, duplicación, malas prácticas
   - 🟢 **BAJA**: Detalles de formato, convenciones menores

8. **Comparar con el código anterior** y mencionar si:
   - ✅ Los cambios REDUCEN la aberrancia
   - ⚠️ Los cambios MANTIENEN la aberrancia
   - ❌ Los cambios AUMENTAN la aberrancia

9. **Proporcionar recomendaciones** específicas para llegar a ≤ 5.5/100

**IMPORTANTE**: 
- Evaluar SOLO los cambios introducidos (líneas con +/- en el diff)
- NO evaluar código que no fue modificado
- Usar `git diff` para obtener cambios reales, no asumir
- Si el usuario no especifica archivo, usar el archivo actual del editor

---

## ⚠️ COMANDOS ADICIONALES

### 📋 Comando `/explain` - SIEMPRE INCLUIR:
1. ✅ **Propósito del código** (qué hace y por qué existe)
2. ✅ **Flujo lógico** paso a paso
3. ✅ **ANÁLISIS DE ABERRANCIA (OBLIGATORIO - NO OMITIR)**:
   
   **Para código Java:**
   - **Complejidad ciclomática** actual vs límite (máx: 10, recomendado: ≤5)
   - **Tamaño de clase** actual vs límite (máx: 500 líneas, recomendado: 200-300)
   - **Longitud de métodos** actual vs límite (máx: 50 líneas, recomendado: 20-30)
   - **Duplicación de código** detectada (tolerancia: 0%)
   - **Acoplamiento y cohesión** (dependencias entre clases)
   - **Código muerto o comentado** detectado
   - **Magic numbers/strings** sin constantes
   - **Score estimado BlueOptima** (0-100) con nivel de severidad (🔴 CRÍTICO / 🟡 MEDIO / 🟢 BAJO)
   - **Recomendaciones específicas** de refactorización priorizadas
   
   **Para archivos Terraform (.tf, .tfvars):**
   - **Complejidad de módulos** (máx: 25 recursos, recomendado: ≤20)
   - **Tamaño de archivo** (máx: 400 líneas, recomendado: 200-300)
   - **Duplicación de código** (tolerancia: 0%)
   - **Variables hardcodeadas** (magic values)
   - **Código comentado** detectado
   - **Falta de documentación** en variables/outputs
   - **Score estimado BlueOptima** (0-100) con nivel de severidad (🔴 CRÍTICO / 🟡 MEDIO / 🟢 BAJO)
   - **Recomendaciones específicas** de refactorización priorizadas

❌ **NO responder a `/explain` sin incluir el análisis completo de aberrancia**

---

#### 🔧 Comando `/fix` - PROCESO OBLIGATORIO:
1. ✅ **Identificar todos los problemas de aberrancia**:
   - Complejidad ciclomática alta
   - Métodos o clases demasiado largos
   - Código duplicado
   - Condicionales anidados (>3 niveles)
   - Manejo incorrecto de excepciones
   - Falta de validaciones
   - Magic numbers/strings
   - Código comentado o dead code
   
2. ✅ **Aplicar refactorizaciones específicas**:
   - Extraer métodos para reducir complejidad
   - Usar early returns para simplificar condicionales
   - Crear constantes para valores hardcodeados
   - Mejorar nombres de variables y métodos
   - Añadir manejo apropiado de excepciones
   - Incluir logging donde sea necesario
   - Eliminar código muerto
   
3. ✅ **Validar resultado**:
   - Complejidad ciclomática ≤ 10
   - Métodos ≤ 50 líneas (idealmente ≤ 30)
   - Sin duplicación de código
   - Nombres descriptivos y claros
   - Código limpio y mantenible

4. ✅ **Explicar cambios realizados** con impacto en aberrancia

❌ **NO hacer fixes superficiales. Priorizar reducción de aberrancia sobre cambios cosméticos**

---

#### 📝 Comando `/doc` - DOCUMENTACIÓN COMPLETA:
1. ✅ **Generar JavaDoc** para métodos públicos y protegidos:
   ```java
   /**
    * [Descripción clara de qué hace el método]
    *
    * @param nombreParam [Descripción del parámetro, incluyendo validaciones]
    * @return [Descripción de qué retorna y en qué casos]
    * @throws TipoExcepcion [Descripción de cuándo y por qué se lanza]
    */
   ```

2. ✅ **Incluir documentación de**:
   - Propósito del método/clase
   - Precondiciones y postcondiciones
   - Casos especiales o edge cases
   - Efectos secundarios
   - Complejidad algorítmica si es relevante (O(n), O(log n), etc.)
   
3. ✅ **Documentar comportamientos no obvios**:
   - Lógica de negocio compleja
   - Integraciones con sistemas externos
   - Validaciones específicas del dominio
   - Razones de decisiones técnicas (el "por qué", no el "qué")

4. ❌ **NO documentar**:
   - Código obvio (getters/setters simples)
   - Implementaciones triviales
   - Métodos privados simples (a menos que tengan lógica compleja)

❌ **NO generar documentación genérica o inútil. Debe aportar valor real**

---

## 📊 Métricas de Aberrancia a Evitar

### 1. Complejidad Ciclomática
- **Límite máximo**: 10 por método
- **Límite recomendado**: 5 o menos
- Evitar anidamiento profundo de condicionales (máximo 3 niveles)
- Refactorizar métodos largos en métodos más pequeños y cohesivos
- Usar early returns para reducir complejidad

### 2. Duplicación de Código
- **Tolerancia**: 0% de duplicación
- No copiar y pegar código; extraer métodos comunes
- Crear utilidades reutilizables para lógica repetida
- Usar herencia, composición o patrones de diseño apropiados
- Si un bloque de código se repite 2+ veces, debe extraerse

### 3. Longitud de Métodos
- **Límite máximo**: 50 líneas por método
- **Límite recomendado**: 20-30 líneas
- Un método debe hacer una sola cosa (Single Responsibility Principle)
- Extraer bloques lógicos en métodos privados con nombres descriptivos

### 4. Longitud de Clases
- **Límite máximo**: 500 líneas por clase
- **Límite recomendado**: 200-300 líneas
- Dividir clases grandes en clases más específicas
- Aplicar principio de responsabilidad única (SRP)

### 5. Profundidad de Herencia
- **Límite máximo**: 3 niveles
- Preferir composición sobre herencia
- Evitar jerarquías profundas y complejas

### 6. Acoplamiento (Coupling)
- Minimizar dependencias entre clases
- Usar inyección de dependencias (Spring @Autowired, Constructor Injection)
- Programar contra interfaces, no implementaciones
- Evitar dependencias circulares

### 7. Cohesión
- Todos los métodos de una clase deben estar relacionados con su propósito
- Si métodos no están relacionados, dividir la clase
- Mantener alta cohesión dentro de módulos

### 8. Comentarios y Código Muerto
- **No dejar código comentado**: eliminar código obsoleto
- Usar Git para historial, no comentarios
- Comentarios deben explicar "por qué", no "qué hace"
- Documentar JavaDoc solo para APIs públicas y lógica compleja

### 9. Nombres de Variables y Métodos
- Usar nombres descriptivos y auto-explicativos
- Evitar abreviaturas poco claras
- Longitud mínima: 3 caracteres (excepto índices como i, j, k en loops cortos)
- Usar camelCase para variables/métodos, PascalCase para clases
- Nombres de métodos booleanos deben empezar con `is`, `has`, `can`, `should`

### 10. Manejo de Excepciones
- No usar bloques try-catch vacíos
- No usar `catch (Exception e)` genérico sin procesar
- Loguear excepciones con contexto apropiado
- Lanzar excepciones específicas del dominio
- No usar excepciones para control de flujo

---

## 🏗️ Métricas de Aberrancia para Terraform / IaC

### ⚠️ APLICABLE A ARCHIVOS .tf, .tfvars, backend.tf, variables.tf, etc.

Aunque el proyecto es principalmente Java, también contiene **infraestructura como código (Terraform)** que debe cumplir con estándares de calidad similares para minimizar aberrancia.

### 1. Complejidad de Módulos/Recursos
- **Límite máximo**: 25 recursos por archivo
- **Límite recomendado**: 15-20 recursos por archivo
- **Anidamiento de condicionales**: Máximo 3 niveles (`count`, `for_each`, ternarios)
- Dividir archivos grandes en módulos reutilizables
- Un módulo debe tener una responsabilidad clara y específica

### 2. Tamaño de Archivos
- **Límite máximo**: 400 líneas por archivo .tf
- **Límite recomendado**: 200-300 líneas
- Dividir en archivos separados: `main.tf`, `variables.tf`, `outputs.tf`, `data.tf`, `backend.tf`
- Si un archivo supera el límite, extraer recursos en módulos

### 3. Duplicación de Código
- **Tolerancia**: 0% de duplicación
- Extraer recursos repetidos en módulos reutilizables
- Usar `for_each` o `count` para recursos similares
- Crear módulos compartidos en carpeta `modules/`
- Si un bloque de configuración se repite 2+ veces, debe extraerse

### 4. Variables Hardcodeadas (Magic Values)
- **NO usar valores hardcodeados** en recursos
- Todas las configuraciones deben ser variables
- Incluir `description` **obligatoriamente** en todas las variables
- Usar `validation` blocks cuando sea apropiado
- Definir `default` values cuando tenga sentido
- Usar `sensitive = true` para datos sensibles

### 5. Naming Conventions
- **Variables**: `snake_case` (e.g., `resource_group_name`, `storage_account_tier`)
- **Recursos**: Descriptivos y consistentes (e.g., `azurerm_resource_group.main`)
- **Módulos**: Nombres claros que reflejen su propósito (e.g., `networking`, `database`)
- **Archivos**: Usar nombres estándar (`main.tf`, `variables.tf`, `outputs.tf`)

### 6. Documentación
- Comentarios que expliquen **por qué**, no **qué**
- **README.md obligatorio** en cada módulo con:
  - Propósito del módulo
  - Inputs requeridos y opcionales
  - Outputs generados
  - Ejemplos de uso
  - Requisitos de versión de Terraform y providers
- Usar comentarios inline para decisiones técnicas complejas

### 7. Código Muerto
- **Eliminar recursos comentados** (usar Git para historial)
- Eliminar variables no utilizadas
- Eliminar outputs innecesarios
- Eliminar módulos obsoletos

### 8. Organización y Modularización
- Agrupar recursos relacionados en módulos
- Mantener **separación de entornos** (`dev/`, `qa/`, `production/`)
- Usar `terraform.tfvars` específico por entorno
- Backend remoto configurado (Azure Storage, S3, etc.)
- Estructura consistente entre entornos

### 9. Seguridad
- **NO hardcodear credenciales**
- Usar `sensitive = true` en variables/outputs con datos sensibles
- Validar permisos mínimos necesarios (Principle of Least Privilege)
- Revisar reglas de firewall y acceso de red
- No exponer información sensible en outputs

### 10. Best Practices Terraform
- **Usar versiones específicas de providers** (no `latest`)
- Implementar `lifecycle` rules cuando sea necesario
- Usar `depends_on` **solo cuando sea absolutamente necesario**
- **Tags consistentes** en todos los recursos:
  - `owner`: Responsable del recurso
  - `environment`: dev/qa/prod
  - `project`: Nombre del proyecto
  - `cost-center`: Centro de costos
- Usar data sources en lugar de valores hardcodeados
- Validar con `terraform fmt` y `terraform validate`
- Usar `terraform plan` antes de `apply`

### 🚨 Anti-Patrones en Terraform

#### ❌ NO HACER: Valores Hardcodeados
```hcl
resource "azurerm_resource_group" "example" {
  name     = "my-resources"  # ❌ Hardcoded
  location = "East US"        # ❌ Hardcoded
}
```

#### ✅ HACER: Usar Variables
```hcl
resource "azurerm_resource_group" "example" {
  name     = var.resource_group_name
  location = var.location
  
  tags = var.common_tags
}
```

#### ❌ NO HACER: Recursos Duplicados
```hcl
resource "azurerm_storage_account" "storage1" {
  name = "storage1"
  # ... configuración
}

resource "azurerm_storage_account" "storage2" {
  name = "storage2"
  # ... misma configuración
}
```

#### ✅ HACER: Usar for_each o Módulos
```hcl
resource "azurerm_storage_account" "storage" {
  for_each = var.storage_accounts
  
  name                     = each.value.name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = each.value.tier
  account_replication_type = each.value.replication_type
  
  tags = var.common_tags
}
```

#### ❌ NO HACER: Variables sin descripción
```hcl
variable "location" {
  type = string
}
```

#### ✅ HACER: Variables con descripción y validación
```hcl
variable "location" {
  description = "Azure region where resources will be deployed"
  type        = string
  default     = "eastus"
  
  validation {
    condition     = contains(["eastus", "westus", "centralus"], var.location)
    error_message = "Location must be eastus, westus, or centralus."
  }
}
```

### ✅ Checklist para Archivos Terraform

Antes de generar o proponer código Terraform, verificar:

- [ ] Archivos ≤ 400 líneas (idealmente ≤ 300)
- [ ] Recursos por archivo ≤ 25 (idealmente ≤ 20)
- [ ] Sin valores hardcodeados (usar variables)
- [ ] Todas las variables tienen `description`
- [ ] Sin duplicación de código
- [ ] Nombres descriptivos (`snake_case`)
- [ ] Sin código comentado o dead code
- [ ] Módulos reutilizables para lógica repetida
- [ ] Backend remoto configurado
- [ ] Variables sensibles marcadas como `sensitive = true`
- [ ] Versiones de providers especificadas
- [ ] Tags consistentes en todos los recursos
- [ ] README.md en módulos
- [ ] Separación clara por entornos
- [ ] Validaciones en variables críticas

---

## 🏗️ Arquitectura y Patrones

### Estructura del Proyecto
```
t_nvdt_core_fork/
├── novedat-core/          # Lógica de negocio principal
├── novedat-services/      # Servicios REST
├── novedat-dal/           # Data Access Layer
├── novedat-administration/
├── adapter-*/             # Adaptadores externos
└── novedat-util-*/        # Utilidades compartidas
```

### Capas Arquitectónicas
1. **Controller**: Endpoints REST, validación de entrada, mapeo DTO
2. **Service**: Lógica de negocio, orquestación, transacciones
3. **Repository**: Acceso a datos, queries
4. **Model/Entity**: Entidades JPA, DTOs

**Regla**: No saltar capas. Controller → Service → Repository

### Patrones Recomendados
- **Builder Pattern**: Para objetos complejos con muchos parámetros
- **Factory Pattern**: Para creación de objetos con lógica condicional
- **Strategy Pattern**: Para algoritmos intercambiables
- **Repository Pattern**: Ya implementado con Spring Data JPA
- **DTO Pattern**: Separar entidades de dominio de objetos de transferencia

---

## ☕ Estándares de Código Java

### Principios SOLID
1. **S**ingle Responsibility: Una clase = una responsabilidad
2. **O**pen/Closed: Abierto para extensión, cerrado para modificación
3. **L**iskov Substitution: Subclases deben ser sustituibles por su clase base
4. **I**nterface Segregation: Interfaces pequeñas y específicas
5. **D**ependency Inversion: Depender de abstracciones, no de concreciones

### Buenas Prácticas Java

#### Inyección de Dependencias
```java
// ✅ CORRECTO: Constructor injection (inmutable, testeable)
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}

// ❌ INCORRECTO: Field injection
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}
```

#### Manejo de Opcionales
```java
// ✅ CORRECTO
public User findUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}

// ❌ INCORRECTO: Retornar null
public User findUser(Long id) {
    User user = userRepository.findById(id);
    if (user == null) {
        return null; // NO HACER ESTO
    }
    return user;
}
```

#### Validaciones
```java
// ✅ CORRECTO: Validación temprana
public void processOrder(Order order) {
    if (order == null) {
        throw new IllegalArgumentException("Order cannot be null");
    }
    if (order.getItems().isEmpty()) {
        throw new InvalidOrderException("Order must contain items");
    }
    
    // Lógica principal
    processPayment(order);
    updateInventory(order);
}

// ❌ INCORRECTO: Validación tardía con anidamiento
public void processOrder(Order order) {
    if (order != null) {
        if (!order.getItems().isEmpty()) {
            // Lógica anidada profundamente
        }
    }
}
```

#### Logging
```java
// ✅ CORRECTO: Logs con contexto
@Slf4j
@Service
public class PaymentService {
    public void processPayment(Payment payment) {
        log.info("Processing payment: paymentId={}, amount={}", 
                 payment.getId(), payment.getAmount());
        try {
            // lógica
            log.debug("Payment processed successfully: paymentId={}", payment.getId());
        } catch (PaymentException e) {
            log.error("Payment processing failed: paymentId={}, error={}", 
                     payment.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
```

#### Streams y Lambdas
```java
// ✅ CORRECTO: Stream limpio y legible
List<String> activeUserEmails = users.stream()
    .filter(User::isActive)
    .map(User::getEmail)
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

// ❌ INCORRECTO: Loop tradicional innecesario
List<String> activeUserEmails = new ArrayList<>();
for (User user : users) {
    if (user.isActive()) {
        if (user.getEmail() != null) {
            activeUserEmails.add(user.getEmail());
        }
    }
}
```

### Lombok (Uso Apropiado)
```java
// ✅ CORRECTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
}

// ⚠️ EVITAR @Data en entidades JPA (puede causar problemas con lazy loading)
// Usar @Getter, @Setter explícitamente
```

---

## 🧪 Testing

### Cobertura de Tests
- **Mínimo requerido**: 80% cobertura
- **Recomendado**: 90%+ cobertura
- Tests unitarios para toda lógica de negocio
- Tests de integración para endpoints REST

### Estructura de Tests
```java
// ✅ CORRECTO: Patrón AAA (Arrange-Act-Assert)
@Test
void shouldCalculateDiscountCorrectly() {
    // Arrange
    Order order = Order.builder()
        .totalAmount(new BigDecimal("100.00"))
        .customerType(CustomerType.PREMIUM)
        .build();
    
    // Act
    BigDecimal discount = discountService.calculateDiscount(order);
    
    // Assert
    assertThat(discount).isEqualByComparingTo(new BigDecimal("10.00"));
}
```

### Nomenclatura de Tests
- Usar `should...When...` o `given...When...Then...`
- Nombres descriptivos que expliquen el escenario
- Un test = un caso de prueba

---

## 🚨 Anti-Patrones a Evitar

### ❌ God Class (Clase Dios)
```java
// NO HACER: Clase que hace demasiadas cosas
public class OrderManager {
    public void createOrder() { }
    public void processPayment() { }
    public void sendEmail() { }
    public void updateInventory() { }
    public void generateInvoice() { }
    public void calculateTax() { }
    // ... 50 métodos más
}
```

### ❌ Magic Numbers
```java
// NO HACER
if (order.getStatus() == 3) { }

// ✅ HACER
private static final int STATUS_COMPLETED = 3;
if (order.getStatus() == STATUS_COMPLETED) { }

// ✅ MEJOR: Usar enum
if (order.getStatus() == OrderStatus.COMPLETED) { }
```

### ❌ Nested Ifs (Ifs Anidados)
```java
// NO HACER: Complejidad ciclomática alta
if (user != null) {
    if (user.isActive()) {
        if (user.hasPermission("ADMIN")) {
            if (user.getAge() >= 18) {
                // hacer algo
            }
        }
    }
}

// ✅ HACER: Early returns
if (user == null) return;
if (!user.isActive()) return;
if (!user.hasPermission("ADMIN")) return;
if (user.getAge() < 18) return;

// hacer algo
```

### ❌ Swallowing Exceptions
```java
// NO HACER
try {
    riskyOperation();
} catch (Exception e) {
    // silencio...
}

// ✅ HACER
try {
    riskyOperation();
} catch (SpecificException e) {
    log.error("Failed to execute risky operation: {}", e.getMessage(), e);
    throw new BusinessException("Operation failed", e);
}
```

---

## 🌐 Idioma por Defecto

### Lenguaje por Defecto: Español
- Todas las sugerencias, explicaciones y documentación generadas deben estar en **español**.
- Solo se utilizará otro idioma si se especifica explícitamente en la solicitud.

---

## 📝 Convenciones de Naming

### Clases
- `UserService`, `OrderController`, `ProductRepository`
- Sufijos: `Service`, `Controller`, `Repository`, `Entity`, `DTO`, `Mapper`, `Validator`

### Métodos
- Verbos: `findById`, `createUser`, `updateOrder`, `deleteProduct`
- Booleanos: `isValid`, `hasPermission`, `canExecute`, `shouldProcess`

### Variables
- Descriptivas: `customerEmail`, `totalAmount`, `orderDate`
- Colecciones: plural `users`, `orders`, `products`

### Constantes
- `UPPER_SNAKE_CASE`: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_SECONDS`

---

## 🔐 Seguridad

- No hardcodear credenciales (usar `application.properties` o variables de entorno)
- Validar toda entrada de usuario
- Sanitizar datos antes de usar en queries
- Usar `@PreAuthorize` para control de acceso
- Loguear intentos de acceso no autorizado

---

## 🚀 Performance

- Usar paginación para queries grandes (`Pageable`)
- Evitar N+1 queries (usar `@EntityGraph` o `JOIN FETCH`)
- Cachear resultados frecuentes (`@Cacheable`)
- Usar índices en base de datos para búsquedas comunes
- Lazy loading por defecto en relaciones JPA

---

## 📚 Contexto del Proyecto

### Tecnologías Principales
- **Java**: 19+
- **Spring Boot**: Framework principal
- **Spring Data JPA**: Acceso a datos
- **Maven**: Gestión de dependencias
- **Lombok**: Reducción de boilerplate

### Módulos del Proyecto
- `novedat-core`: Núcleo del sistema
- `novedat-services`: APIs REST
- `novedat-dal`: Capa de acceso a datos
- `adapter-*`: Integraciones con sistemas externos

---

## ✅ Checklist para Nuevo Código

Antes de generar o proponer código, verificar:

- [ ] Complejidad ciclomática ≤ 10
- [ ] Métodos ≤ 50 líneas (idealmente ≤ 30)
- [ ] Clases ≤ 500 líneas (idealmente ≤ 300)
- [ ] Sin código duplicado
- [ ] Nombres descriptivos y claros
- [ ] Manejo apropiado de excepciones
- [ ] Logs en operaciones importantes
- [ ] Validaciones de entrada
- [ ] Tests unitarios incluidos
- [ ] Sin código comentado o dead code
- [ ] Documentación JavaDoc si es API pública
- [ ] Sigue principios SOLID
- [ ] Usa inyección de dependencias correctamente
- [ ] Sin magic numbers o strings

---

## 🎓 Recursos Adicionales

- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Effective Java - Joshua Bloch](https://www.amazon.com/Effective-Java-Joshua-Bloch/dp/0134685997)
- [Spring Boot Best Practices](https://springframework.guru/spring-boot-best-practices/)
- [SonarQube Rules for Java](https://rules.sonarsource.com/java/)

---

**Recuerda**: Cada línea de código que generes será evaluada por BlueOptima. Prioriza calidad sobre velocidad. Código limpio = menos aberrancia = mejor score.
