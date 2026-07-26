<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DepositResource\Pages;
use App\Models\Deposit;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class DepositResource extends Resource
{
    protected static ?string $model = Deposit::class;

    protected static ?string $navigationIcon = 'heroicon-o-arrow-down-on-square';

    protected static ?string $navigationGroup = 'Gestion';

    protected static ?string $navigationLabel = 'Depositos';

    protected static ?string $modelLabel = 'Deposito';

    protected static ?string $pluralModelLabel = 'Depositos';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informacion del Deposito')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('classification_id')
                            ->label('Clasificacion')
                            ->relationship('classification', 'waste_type')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->formatStateUsing(fn ($state, $record) => $record->classification?->waste_type_label ?? $state),
                        Forms\Components\Select::make('container_id')
                            ->label('Contenedor')
                            ->relationship('container', 'identifier')
                            ->searchable()
                            ->preload()
                            ->nullable(),
                    ]),

                Forms\Components\Section::make('Detalles')
                    ->columns(3)
                    ->schema([
                        Forms\Components\TextInput::make('weight_kg')
                            ->label('Peso (kg)')
                            ->numeric()
                            ->minValue(0)
                            ->step(0.001),
                        Forms\Components\TextInput::make('points_earned')
                            ->label('Puntos Ganados')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->minValue(0),
                        Forms\Components\Toggle::make('classification_correct')
                            ->label('Clasificacion Correcta'),
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
                Tables\Columns\TextColumn::make('classification.waste_type')
                    ->label('Tipo Residuo')
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
                Tables\Columns\TextColumn::make('container.identifier')
                    ->label('Contenedor')
                    ->searchable()
                    ->placeholder('N/A'),
                Tables\Columns\TextColumn::make('weight_kg')
                    ->label('Peso')
                    ->formatStateUsing(fn ($state): string => $state ? $state . ' kg' : 'N/A')
                    ->sortable(),
                Tables\Columns\TextColumn::make('points_earned')
                    ->label('Puntos')
                    ->sortable(),
                Tables\Columns\IconColumn::make('classification_correct')
                    ->label('Correcta')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('classification_correct')
                    ->label('Clasificacion')
                    ->options([
                        1 => 'Correcta',
                        0 => 'Incorrecta',
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
            'index' => Pages\ListDeposits::route('/'),
            'create' => Pages\CreateDeposit::route('/create'),
            'edit' => Pages\EditDeposit::route('/{record}/edit'),
        ];
    }
}
