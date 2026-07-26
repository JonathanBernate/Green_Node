<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'Sistema';

    protected static ?string $navigationLabel = 'Usuarios';

    protected static ?string $modelLabel = 'Usuario';

    protected static ?string $pluralModelLabel = 'Usuarios';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informacion Personal')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nombre')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Juan Perez'),
                        Forms\Components\TextInput::make('email')
                            ->label('Correo Electronico')
                            ->email()
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->placeholder('usuario@email.com'),
                    ]),

                Forms\Components\Section::make('Contrasena')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('password')
                            ->label('Contrasena')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->dehydrateStateUsing(fn ($state) => filled($state) ? bcrypt($state) : null)
                            ->dehydrated(fn ($state) => filled($state))
                            ->placeholder('Minimo 8 caracteres'),
                        Forms\Components\TextInput::make('password_confirmation')
                            ->label('Confirmar Contrasena')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->same('password')
                            ->dehydrated(false),
                    ])
                    ->hiddenOn('view'),

                Forms\Components\Section::make('Verificacion')
                    ->schema([
                        Forms\Components\DateTimePicker::make('email_verified_at')
                            ->label('Email Verificado')
                            ->placeholder('No verificado'),
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
                Tables\Columns\TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->label('Correo')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\IconColumn::make('email_verified_at')
                    ->label('Verificado')
                    ->boolean()
                    ->getStateUsing(fn ($record): bool => filled($record->email_verified_at)),
                Tables\Columns\TextColumn::make('classifications_count')
                    ->label('Clasificaciones')
                    ->counts('classifications')
                    ->sortable(),
                Tables\Columns\TextColumn::make('deposits_count')
                    ->label('Depositos')
                    ->counts('deposits')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Registro')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\Filter::make('verified')
                    ->label('Verificados')
                    ->query(fn ($query) => $query->whereNotNull('email_verified_at')),
                Tables\Filters\Filter::make('unverified')
                    ->label('No Verificados')
                    ->query(fn ($query) => $query->whereNull('email_verified_at')),
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
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
