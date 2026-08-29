Coloca aquí el modelo entrenado en formato TensorFlow.js:

  web/public/model/
  ├── model.json
  ├── group1-shard1of4.bin
  ├── group1-shard2of4.bin
  └── ...

Genéralo con ml/train_waste_classifier.py (carpeta tfjs_model/) y copia
su contenido aquí.

Mientras este archivo model.json no exista, la app usa clasificación
simulada automáticamente. Ver ml/README.md para el detalle.
