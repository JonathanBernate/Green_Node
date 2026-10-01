<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/admin'));

Route::redirect('/login', '/admin/login')->name('login');
