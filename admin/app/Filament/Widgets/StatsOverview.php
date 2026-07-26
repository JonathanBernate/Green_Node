<?php

namespace App\Filament\Widgets;

use App\Models\Classification;
use App\Models\Container;
use App\Models\Deposit;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $totalContainers = Container::count();
        $activeContainers = Container::where('status', 'active')->count();
        $classificationsToday = Classification::whereDate('created_at', today())->count();
        $depositsToday = Deposit::whereDate('created_at', today())->count();
        $totalPoints = Deposit::sum('points_earned');
        $avgFillLevel = Container::where('capacity_kg', '>', 0)
            ->selectRaw('AVG(current_level_kg / capacity_kg * 100) as avg')
            ->value('avg') ?? 0;

        return [
            Stat::make('Contenedores Totales', $totalContainers)
                ->description("$activeContainers activos")
                ->descriptionIcon('heroicon-o-map-pin')
                ->color('success'),
            Stat::make('Clasificaciones Hoy', $classificationsToday)
                ->description('Ultimas 24 horas')
                ->descriptionIcon('heroicon-o-eye')
                ->color('info'),
            Stat::make('Depositos Hoy', $depositsToday)
                ->description('Ultimas 24 horas')
                ->descriptionIcon('heroicon-o-arrow-down-on-square')
                ->color('warning'),
            Stat::make('Puntos Totales', number_format($totalPoints))
                ->description('Acumulados')
                ->descriptionIcon('heroicon-o-trophy')
                ->color('primary'),
            Stat::make('Nivel Promedio', round($avgFillLevel, 1) . '%')
                ->description('De todos los contenedores')
                ->descriptionIcon('heroicon-o-chart-bar')
                ->color($avgFillLevel >= 70 ? 'danger' : 'success'),
        ];
    }
}
