<?php

namespace App\Filament\Resources\LessonCategoryResource\Pages;

use App\Filament\Resources\LessonCategoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListLessonCategories extends ListRecords
{
    protected static string $resource = LessonCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
