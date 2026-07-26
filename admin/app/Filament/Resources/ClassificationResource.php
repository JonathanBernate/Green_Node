<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ClassificationResource\Pages;
use App\Models\Classification;
use App\Models\Container;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ClassificationResource extends Resource
{
    protected static ?string $model = Classification::class;

    protected static ?string $navigationIcon = 'heroicon-o-eye';

    protected static ?string $navigationGroup = 'Gestion';

    protected static ?string $navigationLabel = 'Clasificaciones';

    protected static ?string $modelLabel = 'Clasificacion';

    protected static ?string $pluralModelLabel = 'Clasificaciones';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Clasificacion')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('container_id')
                            ->label('Contenedor')
                            ->relationship('container', 'identifier')
                            ->searchable()
                            ->preload()
                            ->nullable(),
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
                        Forms\Components\TextInput::make('confidence')
                            ->label('Confianza (0-1)')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(1)
                            ->step(0.01),
                    ]),

                Forms\Components\Section::make('Detalles')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('source')
                            ->label('Fuente')
                            ->options([
                                'ai' => 'IA (Automatica)',
                                'manual' => 'Manual',
                            ])
                            ->required()
                            ->default('ai'),
                        Forms\Components\Toggle::make('user_confirmed')
                            ->label('Confirmado por usuario')
                            ->default(true),
                        Forms\Components\FileUpload::make('image_path')
                            ->label('Imagen')
                            ->image()
                            ->directory('classifications')
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Usuario')
                    ->searchable()
                    ->sortable(),
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
                Tables\Columns\TextColumn::make('confidence')
                    ->label('Confianza')
                    ->formatStateUsing(fn ($state): string => round($state * 100, 1) . '%')
                    ->sortable(),
                Tables\Columns\TextColumn::make('source')
                    ->label('Fuente')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'ai' => 'info',
                        'manual' => 'warning',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'ai' => 'IA',
                        'manual' => 'Manual',
                    }),
                Tables\Columns\IconColumn::make('user_confirmed')
                    ->label('Confirmado')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime()
                    ->sortable(),
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
                Tables\Filters\SelectFilter::make('source')
                    ->label('Fuente')
                    ->options([
                        'ai' => 'IA',
                        'manual' => 'Manual',
                    ]),
                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Usuario')
                    ->relationship('user', 'name')
                    ->searchable(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
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
            'index' => Pages\ListClassifications::route('/'),
            'create' => Pages\CreateClassification::route('/create'),
            'edit' => Pages\EditClassification::route('/{record}/edit'),
        ];
    }
}
