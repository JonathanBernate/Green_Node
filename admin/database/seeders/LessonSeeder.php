<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\LessonCategory;
use Illuminate\Database\Seeder;

/** Contenido educativo inicial sobre gestión de residuos (idempotente: se puede ejecutar varias veces). */
class LessonSeeder extends Seeder
{
    public function run(): void
    {
        $cats = [];
        foreach ([
            ['Fundamentos', 'fundamentos', '🌍', 1],
            ['Clasificación', 'clasificacion', '🗂️', 2],
            ['Práctica', 'practica', '🍃', 3],
            ['Seguridad', 'seguridad', '⚠️', 4],
        ] as [$name, $slug, $icon, $order]) {
            $cats[$slug] = LessonCategory::updateOrCreate(['slug' => $slug], ['name' => $name, 'icon' => $icon, 'sort_order' => $order]);
        }

        foreach ($this->lessons() as $i => $l) {
            $lesson = Lesson::updateOrCreate(['slug' => $l['slug']], [
                'lesson_category_id' => $cats[$l['category']]->id,
                'title' => $l['title'],
                'icon' => $l['icon'],
                'summary' => $l['summary'],
                'content' => $l['content'],
                'duration_min' => $l['duration'],
                'points' => $l['points'] ?? 10,
                'sort_order' => $i + 1,
                'is_published' => true,
            ]);

            // Las preguntas se reemplazan para que el seeder sea repetible.
            $lesson->questions()->delete();
            foreach ($l['quiz'] as $j => [$question, $options, $correct, $explanation]) {
                $lesson->questions()->create([
                    'question' => $question,
                    'options' => $options,
                    'correct_option' => $correct,
                    'explanation' => $explanation,
                    'sort_order' => $j + 1,
                ]);
            }
        }
    }

    private function lessons(): array
    {
        return [
            [
                'slug' => 'por-que-separar', 'category' => 'fundamentos', 'icon' => '🌍', 'duration' => 3,
                'title' => '¿Por qué separar los residuos?',
                'summary' => 'Entiende el impacto ambiental de la separación en origen.',
                'content' => "## Separar en la fuente\n\nSeparar los residuos **en el lugar donde se generan** es el primer paso de toda la cadena de gestión. Si los materiales llegan mezclados al relleno sanitario, el papel y el cartón se humedecen, el vidrio se rompe y casi nada se puede recuperar.\n\n### Qué ganamos al separar\n- **Menos residuos en el relleno sanitario**, lo que alarga su vida útil.\n- **Menos gases de efecto invernadero**: los residuos orgánicos enterrados producen metano.\n- **Ahorro de materias primas y energía**: reciclar aluminio usa mucho menos energía que producirlo desde cero.\n- **Ingresos y empleo** para recicladores de oficio y empresas de aprovechamiento.\n\n### La jerarquía de las 3R\n1. **Reducir**: generar menos residuos desde el consumo.\n2. **Reutilizar**: darle otro uso a lo que ya tienes.\n3. **Reciclar**: transformar el material en un producto nuevo.\n\n> Lo más ambiental es el residuo que nunca se genera.",
                'quiz' => [
                    ['¿Cuál es el primer paso de la gestión de residuos?', ['Quemarlos', 'Separarlos en la fuente', 'Enterrarlos juntos'], 1, 'Separar en el lugar donde se generan evita que los materiales se contaminen entre sí.'],
                    ['¿Qué gas producen los residuos orgánicos enterrados?', ['Metano', 'Helio', 'Oxígeno'], 0, 'El metano es un gas de efecto invernadero muy potente.'],
                    ['En las 3R, ¿qué va primero?', ['Reciclar', 'Reutilizar', 'Reducir'], 2, 'Reducir evita generar el residuo, por eso es la prioridad.'],
                ],
            ],
            [
                'slug' => 'tipos-de-residuos', 'category' => 'clasificacion', 'icon' => '🗂️', 'duration' => 5,
                'title' => 'Los 6 tipos de residuos',
                'summary' => 'Distingue orgánico, plástico, papel, vidrio, metal y especial.',
                'content' => "## Las categorías que usa GreenNode\n\n| Tipo | Ejemplos |\n|---|---|\n| **Orgánico** | Restos de comida, cáscaras, poda, café |\n| **Plástico** | Botellas, envases, bolsas limpias |\n| **Papel y cartón** | Cajas, periódico, cuadernos |\n| **Vidrio** | Frascos y botellas |\n| **Metal** | Latas, tapas, chatarra |\n| **Especial** | Pilas, electrónicos, medicamentos, aceite usado |\n\n### Regla de oro\nLos materiales aprovechables deben estar **limpios y secos**. Un envase con restos de comida puede contaminar todo un lote de papel o cartón.\n\n### Y en Colombia, ¿qué colores se usan?\nDesde la Resolución 2184 de 2019 se usan tres colores:\n- ⚪ **Blanco**: residuos aprovechables (plástico, vidrio, metal, papel y cartón).\n- ⚫ **Negro**: residuos no aprovechables.\n- 🟢 **Verde**: residuos orgánicos aprovechables.",
                'quiz' => [
                    ['¿En qué bolsa/contenedor van los residuos orgánicos en Colombia?', ['Blanca', 'Negra', 'Verde'], 2, 'El verde es para residuos orgánicos aprovechables.'],
                    ['Una lata de aluminio es un residuo de tipo…', ['Metal', 'Orgánico', 'Especial'], 0, 'Las latas se clasifican como metal y son muy valiosas para el reciclaje.'],
                    ['¿Cómo deben estar los materiales aprovechables?', ['Mojados', 'Limpios y secos', 'Mezclados'], 1, 'La suciedad y la humedad reducen el valor de reciclaje.'],
                    ['Las pilas se consideran residuo…', ['Papel', 'Orgánico', 'Especial'], 2, 'Contienen metales pesados y requieren manejo diferenciado.'],
                ],
            ],
            [
                'slug' => 'reciclaje-plasticos', 'category' => 'clasificacion', 'icon' => '♻️', 'duration' => 4,
                'title' => 'Reciclaje de plásticos',
                'summary' => 'Códigos de reciclaje y qué plásticos sí se reciclan.',
                'content' => "## El triángulo con número\n\nLos envases plásticos traen un número del 1 al 7 dentro de un triángulo. Indica el tipo de resina.\n\n| Código | Material | Ejemplo | ¿Se recicla fácilmente? |\n|---|---|---|---|\n| 1 | PET | Botellas de gaseosa y agua | Sí |\n| 2 | HDPE | Envases de detergente, galones | Sí |\n| 3 | PVC | Tubos, algunos blísteres | Poco |\n| 4 | LDPE | Bolsas, películas | A veces |\n| 5 | PP | Tapas, envases de yogur | Sí |\n| 6 | PS | Icopor, vasos desechables | Muy poco |\n| 7 | Otros | Mezclas | No |\n\n### Cómo prepararlos\n1. Vacía el envase por completo.\n2. Enjuágalo rápidamente.\n3. **Aplástalo** para ahorrar espacio.\n4. Déjalo secar y deposítalo en la bolsa blanca.",
                'quiz' => [
                    ['¿Qué código tienen las botellas de gaseosa?', ['1 (PET)', '3 (PVC)', '6 (PS)'], 0, 'El PET es el plástico más reciclado.'],
                    ['Antes de reciclar un envase debes…', ['Dejarlo sucio', 'Vaciarlo y enjuagarlo', 'Quemarlo'], 1, 'Un envase limpio conserva su valor para el reciclaje.'],
                    ['Los plásticos aprovechables van en la bolsa…', ['Blanca', 'Negra', 'Verde'], 0, 'La blanca es para residuos aprovechables.'],
                ],
            ],
            [
                'slug' => 'compostaje-en-casa', 'category' => 'practica', 'icon' => '🍃', 'duration' => 6, 'points' => 15,
                'title' => 'Compostaje en casa',
                'summary' => 'Convierte tus residuos orgánicos en abono.',
                'content' => "## ¿Qué es el compostaje?\n\nEs la descomposición controlada de residuos orgánicos por microorganismos. El resultado es **compost**, un abono natural rico en nutrientes.\n\n### Qué sí compostar\n- 🟤 **Marrones (carbono)**: hojas secas, cartón sin tinta, aserrín.\n- 🟢 **Verdes (nitrógeno)**: cáscaras de frutas y verduras, café, restos de césped.\n\n### Qué NO compostar\nCarnes, lácteos, grasas, aceites, excrementos de mascotas y plantas enfermas: generan olores y atraen plagas.\n\n### Receta básica\n1. Usa un recipiente con **huecos de aireación** y tapa.\n2. Alterna capas de verdes y marrones (aprox. 1 de verdes por 2-3 de marrones).\n3. Mantén la humedad como una **esponja escurrida**.\n4. **Voltea** la mezcla cada semana para airearla.\n5. En 2 a 3 meses tendrás un material oscuro con olor a tierra de bosque.\n\n> Si huele mal, falta aire o hay demasiada humedad: agrega material marrón y voltea.",
                'quiz' => [
                    ['¿Cuál de estos NO se debe compostar en casa?', ['Cáscaras de fruta', 'Restos de carne', 'Hojas secas'], 1, 'La carne se pudre con olor fuerte y atrae plagas.'],
                    ['¿Cada cuánto conviene voltear el compost?', ['Cada semana', 'Nunca', 'Una vez al año'], 0, 'Voltear lo airea y acelera la descomposición.'],
                    ['Si el compost huele mal, ¿qué falta normalmente?', ['Más agua', 'Aire y material marrón', 'Más carne'], 1, 'El mal olor suele indicar exceso de humedad y poco aire.'],
                    ['La humedad ideal se parece a…', ['Una esponja escurrida', 'Un charco', 'Arena seca'], 0, 'Húmedo, pero sin que escurra agua.'],
                ],
            ],
            [
                'slug' => 'residuos-especiales', 'category' => 'seguridad', 'icon' => '⚠️', 'duration' => 4,
                'title' => 'Residuos especiales y peligrosos',
                'summary' => 'Cómo manejar pilas, electrónicos y medicamentos.',
                'content' => "## No van a la basura común\n\nEstos residuos contienen sustancias que contaminan el agua y el suelo, o que pueden ser peligrosas para quien los manipula.\n\n### Pilas y baterías\nContienen metales pesados (mercurio, cadmio, plomo). Entrégalas en **puntos de recolección de posconsumo**, no en el cesto de la basura.\n\n### Residuos electrónicos (RAEE)\nCelulares, cargadores, computadores y electrodomésticos pequeños. Tienen metales valiosos recuperables. Llévalos a campañas de recolección o a gestores autorizados.\n\n### Medicamentos vencidos\nNo los tires al inodoro ni al lavamanos. Deposítalos en los **contenedores de posconsumo** de farmacias o puntos autorizados.\n\n### Aceite de cocina usado\n1. Déjalo enfriar.\n2. Guárdalo en una botella plástica cerrada.\n3. Entrégalo a un gestor o punto de acopio. **Nunca** por el desagüe: 1 litro puede contaminar miles de litros de agua.\n\n⚠️ **Seguridad:** usa guantes con residuos cortopunzantes o químicos y no mezcles productos.",
                'quiz' => [
                    ['¿Dónde se entregan las pilas usadas?', ['En el desagüe', 'En puntos de posconsumo', 'En la bolsa de orgánicos'], 1, 'Los puntos de posconsumo las envían a gestores autorizados.'],
                    ['El aceite de cocina usado debe…', ['Botarse por el lavaplatos', 'Guardarse en una botella y entregarse a un gestor', 'Mezclarse con el compost'], 1, 'Por el desagüe contamina fuentes de agua y tapona tuberías.'],
                    ['Los medicamentos vencidos se depositan en…', ['El inodoro', 'La bolsa verde', 'Contenedores de posconsumo'], 2, 'Evita contaminar el agua y que otras personas los consuman.'],
                ],
            ],
            [
                'slug' => 'reducir-y-reutilizar', 'category' => 'practica', 'icon' => '🔄', 'duration' => 4,
                'title' => 'Reducir y reutilizar en el día a día',
                'summary' => 'Hábitos simples para generar menos residuos.',
                'content' => "## Menos residuos desde la compra\n\n- 🛍️ Lleva tu **bolsa reutilizable** y evita bolsas plásticas de un solo uso.\n- 🧴 Prefiere **envases retornables** o recargables.\n- 🥫 Compra a granel cuando sea posible.\n- 🍽️ Planea tus comidas: se desperdicia menos alimento.\n- 🔧 **Repara** antes de reemplazar: ropa, calzado, electrodomésticos.\n\n### Ideas de reutilización\n- Frascos de vidrio como recipientes.\n- Cajas de cartón para organizar.\n- Ropa en desuso: donarla o intercambiarla.\n\n### Desperdicio de alimentos\nUna parte importante de lo que va al relleno es comida. Congela sobras, usa frutas maduras en jugos o compotas y guarda los alimentos según su tipo.",
                'quiz' => [
                    ['¿Cuál es una buena práctica para reducir residuos?', ['Usar bolsa reutilizable', 'Pedir bolsa nueva siempre', 'Comprar de más'], 0, 'Evita residuos de un solo uso.'],
                    ['Antes de reemplazar un objeto dañado, lo ideal es…', ['Repararlo', 'Botarlo', 'Quemarlo'], 0, 'Reparar alarga la vida útil y evita residuos.'],
                ],
            ],
            [
                'slug' => 'vidrio-papel-metal', 'category' => 'clasificacion', 'icon' => '🥫', 'duration' => 4,
                'title' => 'Vidrio, papel y metal',
                'summary' => 'Cómo preparar y reciclar estos tres materiales.',
                'content' => "## Vidrio\nSe puede reciclar **infinitas veces** sin perder calidad. Retira tapas y enjuaga. No mezcles con espejos, bombillas, cerámica ni vidrio de ventana: tienen otra composición.\n\n## Papel y cartón\nDeben estar **secos y sin grasa**. Una caja de pizza con grasa no se recicla (la parte limpia sí). Aplana las cajas para ahorrar espacio.\n\n## Metal\nLatas de aluminio y de acero, tapas y utensilios metálicos. Enjuágalas y aplástalas. Las latas de aerosol vacías también se reciclan, pero nunca las perfores ni las incineres.\n\n### Resumen rápido\n| Material | Prepáralo | Evita |\n|---|---|---|\n| Vidrio | Enjuagar, sin tapa | Espejos y bombillas |\n| Papel/cartón | Seco y limpio | Papel con grasa |\n| Metal | Enjuagar y aplastar | Perforar aerosoles |",
                'quiz' => [
                    ['¿Cuántas veces se puede reciclar el vidrio?', ['Una sola vez', 'Infinitas veces', 'Tres veces'], 1, 'El vidrio no pierde calidad al reciclarse.'],
                    ['El papel con grasa…', ['Se recicla igual', 'No se recicla', 'Va en la bolsa verde siempre'], 1, 'La grasa impide el proceso de reciclaje del papel.'],
                    ['Un espejo se recicla con el vidrio de botellas.', ['Verdadero', 'Falso'], 1, 'Tiene recubrimientos y una composición distinta.'],
                ],
            ],
        ];
    }
}
