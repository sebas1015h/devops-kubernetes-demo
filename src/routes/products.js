const express = require('express');

const products = [
  {
    id: 'creditos',
    name: 'Créditos',
    description: 'Financiamiento cercano para impulsar el crecimiento de personas y negocios.',
  },
  {
    id: 'cuentas',
    name: 'Cuentas',
    description: 'Cuentas claras y accesibles para administrar el día a día.',
  },
  {
    id: 'inversiones',
    name: 'Inversiones',
    description: 'Opciones para hacer crecer el dinero con un enfoque simple.',
  },
  {
    id: 'seguros',
    name: 'Seguros',
    description: 'Protección pensada para acompañar con tranquilidad.',
  },
];

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ products });
});

router.get('/:id', (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.status(200).json(product);
});

module.exports = router;
