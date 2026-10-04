Coloca aquí el modelo entrenado (formato TFLite) descargado de Colab:

  web/public/model/
  ├── waste_classifier_v1.tflite    (el modelo)
  └── labels.json                   (orden de clases, ej: ["plastic","paper",...])

Ambos archivos se descargan al final del notebook ml/GreenNode_Entrenamiento.ipynb.

Mientras waste_classifier_v1.tflite no exista, la app usa clasificación
simulada automáticamente.

Nota: el modelo actual tiene 6 clases (ver labels.json) y NORMALIZA LA ENTRADA POR SI MISMO
(incluye mobilenet_v2.preprocess_input). Hay que enviarle pixeles crudos en [0, 255]; si se
normaliza a [-1, 1] antes, las predicciones dejan de depender de la imagen.
