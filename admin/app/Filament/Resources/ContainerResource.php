<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ContainerResource\Pages;
use App\Models\Container;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ContainerResource extends Resource
{
    protected static ?string $model = Container::class;

    protected static ?string $navigationIcon = 'heroicon-o-map-pin';

    protected static ?string $navigationGroup = 'Gestion';

    protected static ?string $navigationLabel = 'Contenedores';

    protected static ?string $modelLabel = 'Contenedor';

    protected static ?string $pluralModelLabel = 'Contenedores';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informacion Basica')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('identifier')
                            ->label('Identificador')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('CONT-001'),
                        Forms\Components\Select::make('waste_type')
                            ->label('Tipo de Residuo')
                            ->options([
                                'organic' => 'Organico',
                                'plastic' => 'Plastico',
                                'paper' => 'Papel',
                                'glass' => 'Vidrio',
                                'metal' => 'Metal',
                                'special' => 'Residuo Especial',
                            ])
                            ->required(),
                        Forms\Components\TextInput::make('address')
                            ->label('Direccion')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ]),

                Forms\Components\Section::make('Ubicacion GPS')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('latitude')
                            ->label('Latitud')
                            ->required()
                            ->numeric(),
                        Forms\Components\TextInput::make('longitude')
                            ->label('Longitud')
                            ->required()
                            ->numeric(),
                    ]),

                Forms\Components\Section::make('Capacidad y Estado')
                    ->columns(3)
                    ->schema([
                        Forms\Components\TextInput::make('capacity_kg')
                            ->label('Capacidad (kg)')
                            ->required()
                            ->numeric()
                            ->minValue(1),
                        Forms\Components\TextInput::make('current_level_kg')
                            ->label('Nivel Actual (kg)')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->minValue(0),
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options([
                                'active' => 'Activo',
                                'inactive' => 'Inactivo',
                                'maintenance' => 'Mantenimiento',
                            ])
                            ->required()
                            ->default('active'),
                    ]),

                Forms\Components\Section::make('Mantenimiento')
                    ->schema([
                        Forms\Components\DateTimePicker::make('last_collected_at')
                            ->label('Ultima Recoleccion'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('identifier')
                    ->label('ID')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('address')
                    ->label('Direccion')
                    ->searchable()
                    ->limit(30),
                Tables\Columns\TextColumn::make('waste_type')
                    ->label('Tipo')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'organic' => 'success',
                        'plastic' => 'warning',
                        'paper' => 'info',
                        'glass' => 'primary',
                        'metal' => 'gray',
                        'special' => 'danger',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'organic' => 'Organico',
                        'plastic' => 'Plastico',
                        'paper' => 'Papel',
                        'glass' => 'Vidrio',
                        'metal' => 'Metal',
                        'special' => 'Especial',
                    }),
                Tables\Columns\TextColumn::make('fill_level_percent')
                    ->label('Nivel')
                    ->suffix('%')
                    ->badge()
                    ->color(fn (float $state): string => match (true) {
                        $state >= 90 => 'danger',
                        $state >= 70 => 'warning',
                        $state >= 40 => 'info',
                        default => 'success',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'inactive' => 'gray',
                        'maintenance' => 'warning',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'active' => 'Activo',
                        'inactive' => 'Inactivo',
                        'maintenance' => 'Mantenimiento',
                    }),
                Tables\Columns\TextColumn::make('last_collected_at')
                    ->label('Ultima Recoleccion')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('Nunca'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('waste_type')
                    ->label('Tipo de Residuo')
                    ->options([
                        'organic' => 'Organico',
                        'plastic' => 'Plastico',
                        'paper' => 'Papel',
                        'glass' => 'Vidrio',
                        'metal' => 'Metal',
                        'special' => 'Especial',
                    ]),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'active' => 'Activo',
                        'inactive' => 'Inactivo',
                        'maintenance' => 'Mantenimiento',
                    ]),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListContainers::route('/'),
            'create' => Pages\CreateContainer::route('/create'),
            'edit' => Pages\EditContainer::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
