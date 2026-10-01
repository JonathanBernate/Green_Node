<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LessonResource\Pages;
use App\Filament\Resources\LessonResource\RelationManagers;
use App\Models\Lesson;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class LessonResource extends Resource
{
    protected static ?string $model = Lesson::class;

    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?string $navigationGroup = 'Aprendizaje';

    protected static ?string $modelLabel = 'lección';

    protected static ?string $pluralModelLabel = 'lecciones';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Información')->schema([
                Forms\Components\TextInput::make('title')
                    ->label('Título')->required()->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn (Forms\Set $set, ?string $state, string $operation) => $operation === 'create' ? $set('slug', Str::slug((string) $state)) : null),
                Forms\Components\TextInput::make('slug')->required()->maxLength(255)->unique(ignoreRecord: true),
                Forms\Components\Select::make('lesson_category_id')
                    ->label('Categoría')->relationship('category', 'name')->required()->searchable()->preload()
                    ->createOptionForm([
                        Forms\Components\TextInput::make('name')->required()->unique('lesson_categories', 'name'),
                        Forms\Components\TextInput::make('slug')->required()->unique('lesson_categories', 'slug'),
                    ]),
                Forms\Components\TextInput::make('icon')->label('Icono (emoji)')->maxLength(16),
                Forms\Components\Textarea::make('summary')->label('Resumen')->required()->maxLength(300)->rows(2)->columnSpanFull(),
            ])->columns(2),

            Forms\Components\Section::make('Contenido')->schema([
                Forms\Components\MarkdownEditor::make('content')
                    ->label('Contenido de la lección')->required()->columnSpanFull(),
            ]),

            Forms\Components\Section::make('Ajustes')->schema([
                Forms\Components\TextInput::make('duration_min')->label('Duración (min)')->numeric()->minValue(1)->default(3)->required(),
                Forms\Components\TextInput::make('points')->label('Puntos al completar')->numeric()->minValue(0)->default(10)->required(),
                Forms\Components\TextInput::make('sort_order')->label('Orden')->numeric()->default(0),
                Forms\Components\Toggle::make('is_published')->label('Publicada')->default(true),
            ])->columns(4),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('icon')->label(''),
                Tables\Columns\TextColumn::make('title')->label('Título')->searchable()->sortable()->wrap(),
                Tables\Columns\TextColumn::make('category.name')->label('Categoría')->badge()->sortable(),
                Tables\Columns\TextColumn::make('questions_count')->counts('questions')->label('Preguntas'),
                Tables\Columns\TextColumn::make('duration_min')->label('Min')->sortable(),
                Tables\Columns\TextColumn::make('points')->label('Pts')->sortable(),
                Tables\Columns\ToggleColumn::make('is_published')->label('Publicada'),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\SelectFilter::make('lesson_category_id')->label('Categoría')->relationship('category', 'name'),
                Tables\Filters\TernaryFilter::make('is_published')->label('Publicada'),
            ])
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\BulkActionGroup::make([Tables\Actions\DeleteBulkAction::make()])]);
    }

    public static function getRelations(): array
    {
        return [RelationManagers\QuestionsRelationManager::class];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListLessons::route('/'),
            'create' => Pages\CreateLesson::route('/create'),
            'edit' => Pages\EditLesson::route('/{record}/edit'),
        ];
    }
}
