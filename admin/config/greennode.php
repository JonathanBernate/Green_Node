<?php

return [
    /*
     * Código que debe ingresar quien se registra como "contenedor". Si está vacío, cualquiera puede
     * registrar un contenedor. Un contenedor registrado aparece en el mapa y puede reportar ubicaciones:
     * en producción conviene definir CONTAINER_REGISTRATION_CODE en .env.
     */
    'container_registration_code' => env('CONTAINER_REGISTRATION_CODE', ''),
];
