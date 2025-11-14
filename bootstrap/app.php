<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',          // 👈 IMPORTANTE: aquí cargamos las rutas API
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
        // Aquí puedes registrar middleware globales si los necesitas,
        // por ahora lo dejamos como viene por default.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
        // Aquí podrías personalizar el manejo de excepciones.
    })
    ->create();
