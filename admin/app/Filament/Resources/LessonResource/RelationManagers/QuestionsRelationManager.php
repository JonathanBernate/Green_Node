<?php

namespace App\Filament\Resources\LessonResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class QuestionsRelationManager extends RelationManager
{
    protected static string $relationship = 'questions';

    protected static ?string $title = 'Preguntas del cuestionario';

    protected static ?string $modelLabel = 'pregunta';

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('question')->label('Pregunta')->required()->maxLength(255)->columnSpanFull(),
            Forms\Components\Repeater::make('options')
                ->label('Opciones de respuesta')
                ->simple(Forms\Components\TextInput::make('option')->required()->maxLength(200))
                ->minItems(2)->maxItems(5)->defaultItems(3)->reorderable(false)->required()
                ->live()
                ->columnSpanFull(),
            Forms\Components\Select::make('correct_option')
                ->label('Opción correcta')
                ->options(fn (Forms\Get $get) => collect($get('options') ?? [])
                    ->values()->mapWithKeys(fn ($o, $i) => [$i => ($i + 1).'. '.($o ?: '…')])->all())
                ->required(),
            Forms\Components\TextInput::make('sort_order')->label('Orden')->numeric()->default(0),
            Forms\Components\Textarea::make('explanation')->label('Explicación (se muestra al responder)')->rows(2)->columnSpanFull(),
        ])->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('question')
            ->columns([
                Tables\Columns\TextColumn::make('question')->label('Pregunta')->wrap()->searchable(),
                Tables\Columns\TextColumn::make('correct_option')->label('Correcta')->formatStateUsing(fn ($state) => (int) $state + 1),
                Tables\Columns\TextColumn::make('sort_order')->label('Orden'),
            ])
            ->defaultSort('sort_order')
            ->headerActions([Tables\Actions\CreateAction::make()])
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()]);
    }
}
