const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const { uploadSingle, deleteSingle } = require('../utils/cloudinary');

// ═══ DEFAULT CATALOGUE FOR SEEDING ═══
const DEFAULT_PRODUCTS = [
  {id:1,name:'Mayo Scissors (Straight)',cat:'general',icon:'✂️',desc:'Stainless steel mayo scissors for cutting sutures and tissues.',material:'SS 304',size:'14cm / 17cm',sterile:'Non-Sterile',moq:'10 units',spec:'Straight & Curved',packaging:'Individual / Bulk'},
  {id:2,name:'Mosquito Forceps',cat:'general',icon:'🔧',desc:'Hemostatic clamps for controlling small blood vessels.',material:'SS 316L',size:'12.5cm / 14cm',sterile:'Non-Sterile',moq:'10 units',spec:'Curved & Straight',packaging:'Individual'},
  {id:3,name:'Kocher Forceps',cat:'general',icon:'🔩',desc:'Heavy-duty tissue holding forceps with 1×2 teeth.',material:'SS 304',size:'14cm / 18cm / 20cm',sterile:'Non-Sterile',moq:'5 units',spec:'With Teeth',packaging:'Individual / Bulk'},
  {id:4,name:'Laparoscopic Trocar Set',cat:'specialty',icon:'🔬',desc:'Complete trocar set for laparoscopic procedures in 5mm, 10mm, 12mm.',material:'Medical Grade SS',size:'5mm / 10mm / 12mm',sterile:'Non-Sterile',moq:'1 set',spec:'3-Piece Set',packaging:'Set Box'},
  {id:5,name:'Surgical Gloves (Sterile)',cat:'disposables',icon:'🧤',desc:'Latex surgical gloves, sterile, powder-free, pairs packed.',material:'Natural Latex',size:'6.0 to 9.0',sterile:'Sterile',moq:'100 pairs',spec:'Powder Free',packaging:'Box of 50 pairs'},
  {id:6,name:'IV Cannula 20G',cat:'disposables',icon:'💉',desc:'Intravenous cannula with flashback chamber, sterile packed.',material:'Teflon / PP',size:'20G / 22G / 24G',sterile:'Sterile',moq:'100 pcs',spec:'With Wings',packaging:'Individual blister'},
  {id:7,name:'Bone Chisel Set',cat:'orthopedic',icon:'🦴',desc:'Complete set of orthopedic bone chisels in various widths.',material:'Surgical SS',size:'6mm to 25mm',sterile:'Non-Sterile',moq:'1 set',spec:'7-Piece Set',packaging:'Roll Pouch'},
  {id:8,name:'Shadowless OT Light',cat:'ot',icon:'💡',desc:'LED shadowless operating light with adjustable arm, 120,000 Lux.',material:'Aluminum / ABS',size:'Single Dome',sterile:'N/A',moq:'1 unit',spec:'LED, 120K Lux',packaging:'Wooden Crate'},
  {id:9,name:'Digital Stethoscope',cat:'diagnostic',icon:'🩺',desc:'Dual-head stethoscope with acoustic clarity for clinical use.',material:'Stainless Steel / PVC',size:'Standard',sterile:'N/A',moq:'1 unit',spec:'Dual Head',packaging:'Carry Case'},
  {id:10,name:'Needle Holder (Mayo-Hegar)',cat:'general',icon:'🪡',desc:'Standard needle holder for suturing — tungsten carbide inserts.',material:'SS 304 + TC',size:'14cm / 18cm / 20cm',sterile:'Non-Sterile',moq:'5 units',spec:'TC Insert',packaging:'Individual'},
  {id:11,name:'Orthopedic Mallet',cat:'orthopedic',icon:'🔨',desc:'Stainless steel orthopedic mallet for bone manipulation.',material:'SS 316',size:'250g / 500g',sterile:'Non-Sterile',moq:'2 units',spec:'SS Head',packaging:'Individual'},
  {id:12,name:'Suction Machine (Electric)',cat:'ot',icon:'⚙️',desc:'Portable electric suction machine for surgical aspiration.',material:'ABS Plastic / SS',size:'7L Tank',sterile:'N/A',moq:'1 unit',spec:'7L, 600mmHg',packaging:'Carton'},
  {id:13,name:'Absorbable Suture (Vicryl)',cat:'disposables',icon:'🧵',desc:'Polyglactin 910 absorbable sutures, sterile, needle attached.',material:'Polyglactin 910',size:'1-0 to 4-0',sterile:'Sterile',moq:'12 pcs',spec:'Needle Attached',packaging:'Individual foil pack'},
  {id:14,name:'ENT Nasal Speculum',cat:'specialty',icon:'👂',desc:'Killian nasal speculum for anterior rhinoscopy examination.',material:'SS 304',size:'Small / Medium / Large',sterile:'Non-Sterile',moq:'5 units',spec:'Self-Retaining',packaging:'Individual'},
  {id:15,name:'Reflex Hammer (Taylor)',cat:'diagnostic',icon:'🔴',desc:'Classic Taylor percussion hammer for neurological examination.',material:'Rubber / Chrome Steel',size:'Standard',sterile:'N/A',moq:'5 units',spec:'Taylor Type',packaging:'Individual'},
  {id:16,name:'Retractor (Langenbeck)',cat:'general',icon:'📏',desc:'Double-ended Langenbeck retractor for wound exposure.',material:'SS 304',size:'Small / Medium / Large',sterile:'Non-Sterile',moq:'5 units',spec:'Double Ended',packaging:'Individual'}
];

/**
 * @route   GET /api/products
 * @desc    Get all catalogue products sorted by id
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ msg: 'Server error fetching catalogue products' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Add a new product
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  const { name, cat, images, sizes, icon, size, desc, material, sterile, spec, moq, packaging } = req.body;

  if (!name || !cat) {
    return res.status(400).json({ msg: 'Name and Category are required' });
  }

  try {
    // 1. Process base64 images into Cloudinary CDN secure URLs
    const uploadedUrls = [];
    const imageList = Array.isArray(images) ? images : [];
    
    for (let i = 0; i < imageList.length; i++) {
      const img = imageList[i];
      if (img.startsWith('data:')) {
        const url = await uploadSingle(img);
        uploadedUrls.push(url);
      } else {
        uploadedUrls.push(img); // Already a URL
      }
    }

    // Determine default icon
    const productIcon = uploadedUrls.length ? '📸' : (icon || '📦');

    // Get next ID increment
    const lastProduct = await Product.findOne().sort({ id: -1 });
    const nextId = lastProduct ? lastProduct.id + 1 : 1;

    // 2. Create product document
    const newProduct = new Product({
      id: nextId,
      name,
      cat,
      images: uploadedUrls,
      sizes: Array.isArray(sizes) ? sizes : [size || 'Universal'],
      icon: productIcon,
      size: Array.isArray(sizes) ? sizes.join(' / ') : (size || 'Universal'),
      desc: desc || '',
      material: material || '',
      sterile: sterile || 'Non-Sterile',
      spec: spec || '',
      moq: moq || '10 units',
      packaging: packaging || 'Individual / Bulk'
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ msg: 'Server error adding catalogue product: ' + err.message });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update an existing product by id
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, cat, images, sizes, icon, size, desc, material, sterile, spec, moq, packaging } = req.body;

  if (isNaN(productId)) {
    return res.status(400).json({ msg: 'Invalid product ID parameter' });
  }

  try {
    const existingProduct = await Product.findOne({ id: productId });
    if (!existingProduct) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // 1. Delete orphaned images from Cloudinary
    const oldImages = existingProduct.images || [];
    const newImages = Array.isArray(images) ? images : [];
    
    const orphanedImages = oldImages.filter(url => !newImages.includes(url));
    for (const url of orphanedImages) {
      await deleteSingle(url);
    }

    // 2. Upload any new base64 images to Cloudinary
    const finalUrls = [];
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      if (img.startsWith('data:')) {
        const url = await uploadSingle(img);
        finalUrls.push(url);
      } else {
        finalUrls.push(img); // Already a URL
      }
    }

    // Determine default icon
    const productIcon = finalUrls.length ? '📸' : (icon || existingProduct.icon || '📦');

    // 3. Update database record
    existingProduct.name = name || existingProduct.name;
    existingProduct.cat = cat || existingProduct.cat;
    existingProduct.images = finalUrls;
    existingProduct.sizes = Array.isArray(sizes) ? sizes : existingProduct.sizes;
    existingProduct.icon = productIcon;
    existingProduct.size = Array.isArray(sizes) ? sizes.join(' / ') : (size || existingProduct.size);
    existingProduct.desc = desc !== undefined ? desc : existingProduct.desc;
    existingProduct.material = material !== undefined ? material : existingProduct.material;
    existingProduct.sterile = sterile || existingProduct.sterile;
    existingProduct.spec = spec !== undefined ? spec : existingProduct.spec;
    existingProduct.moq = moq !== undefined ? moq : existingProduct.moq;
    existingProduct.packaging = packaging !== undefined ? packaging : existingProduct.packaging;

    const updatedProduct = await existingProduct.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ msg: 'Server error updating catalogue product: ' + err.message });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product and purge its Cloudinary assets
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ msg: 'Invalid product ID parameter' });
  }

  try {
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // 1. Purge all images from Cloudinary
    const images = product.images || [];
    for (const url of images) {
      await deleteSingle(url);
    }

    // 2. Remove document from MongoDB
    await Product.deleteOne({ id: productId });
    res.json({ msg: 'Product successfully deleted from MongoDB & Cloudinary' });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ msg: 'Server error deleting catalogue product' });
  }
});

/**
 * Helper to seed the database
 */
async function seedHelper() {
  const count = await Product.countDocuments();
  if (count > 0) return false;

  const docs = DEFAULT_PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    cat: p.cat,
    icon: p.icon || '📦',
    desc: p.desc || '',
    material: p.material || '',
    sizes: p.size ? p.size.split('/').map(s => s.trim()) : ['Universal'],
    size: p.size || 'Universal',
    sterile: p.sterile || 'Non-Sterile',
    spec: p.spec || '',
    moq: p.moq || '10 units',
    packaging: p.packaging || 'Individual / Bulk',
    images: []
  }));

  await Product.insertMany(docs);
  return true;
}

/**
 * @route   POST /api/products/seed
 * @desc    Seed 16 default products if collection is empty
 * @access  Private
 */
router.post('/seed', auth, async (req, res) => {
  try {
    const seeded = await seedHelper();
    if (seeded) {
      res.json({ msg: 'Database seeded with default products successfully' });
    } else {
      res.status(400).json({ msg: 'Database already has products. Seeding aborted.' });
    }
  } catch (err) {
    console.error("Seeding database error:", err);
    res.status(500).json({ msg: 'Database seeding failed: ' + err.message });
  }
});

/**
 * @route   POST /api/products/reset
 * @desc    Reset catalogue back to 16 default sample products (purges all custom images)
 * @access  Private
 */
router.post('/reset', auth, async (req, res) => {
  try {
    // 1. Purge all images for every product currently in database
    const allProducts = await Product.find();
    for (const p of allProducts) {
      const images = p.images || [];
      for (const url of images) {
        await deleteSingle(url);
      }
    }

    // 2. Clear collection
    await Product.deleteMany({});

    // 3. Re-seed defaults
    await seedHelper();

    res.json({ msg: 'Database reset to default sample products successfully' });
  } catch (err) {
    console.error("Resetting database error:", err);
    res.status(500).json({ msg: 'Database resetting failed: ' + err.message });
  }
});

module.exports = router;
module.exports.seedHelper = seedHelper;
