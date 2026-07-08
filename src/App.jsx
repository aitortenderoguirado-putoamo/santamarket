import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  Plus, 
  Trash2, 
  X,
  CreditCard,
  Printer,
  AlertTriangle,
  Award,
  Lock,
  Check
} from 'lucide-react';

// --- CONFIGURATION ---
const DEFAULT_SUPABASE_URL = "https://your-project.supabase.co";
const DEFAULT_SUPABASE_KEY = "your-anon-key";

// --- SEED CATALOG CORRECTED TO ALIGN WITH DESGLOSE ---
const SEED_CATEGORIES = {
  Bañadores: { coste: 19.0, pvp: 55.0, tallas: ['S', 'M', 'L', 'XL', 'XXL'] },
  Camisetas: { coste: 6.0, pvp: 30.0, tallas: ['S', 'M', 'L', 'XL'] },
  Camisas: { coste: 12.0, pvp: 55.0, tallas: ['S', 'M', 'L', 'XL'] },
  "Pantalón Corto": { coste: 11.5, pvp: 55.0, tallas: ['S', 'M', 'L', 'XL'] },
  "Pantalón Largo": { coste: 14.0, pvp: 60.0, tallas: ['S', 'M', 'L', 'XL'] },
  Toallas: { coste: 10.0, pvp: 20.0, tallas: ['UNICA'] },
  Gafas: { coste: 8.0, pvp: 15.0, tallas: ['UNICA'] }
};

const SEED_MODELS = {
  Bañadores: [
    'Sea Lion', 'Turtles', 'Tunas', 'Coral Rojo', 'Stars', 'Coral Azul', 
    'Hammer', 'Wraps', 'Microplastics', 'Amarillo', 'Straws', 'Goodvibes', 
    'Surfers', 'Sixpack', 'Currents', 'Baywatch', 'Deep Blue', 'Anemona', 'Crab'
  ],
  Camisetas: [
    'Catch Waves', 'Out of Office', 'Fuck Plastic', 'Yatch Club', 'Power'
  ],
  Camisas: ['Azul', 'Blanca', 'Verde', 'Marrón'],
  "Pantalón Corto": ['Blanco', 'Verde'],
  "Pantalón Largo": ['Blanco', 'Kaki'],
  Toallas: ['Toalla'],
  Gafas: ['Gafas']
};

const DEFAULT_WORKERS = ['Aitor', 'Joan', 'Moha'];

// Admin config: Aitor has full admin powers, Moha and Joan have salesperson access
const ADMIN_WORKERS = ['Aitor'];

// --- HISTORICAL DATASET (From 2023, 2024, 2025 records) ---
const HISTORICAL_DATA = {
  years: {
    2023: { total: 6692, julio: 6692, agosto: 0, dias: 21, uds: 140, ticketMedio: 47.8 },
    2024: { total: 17422, julio: 7386, agosto: 10036, dias: 42, uds: 360, ticketMedio: 48.4 },
    2025: { total: 31063.20, julio: 10045, agosto: 21018, dias: 52, uds: 626, ticketMedio: 49.6 }
  },
  products2025: {
    Bañadores: 402,
    Camisetas: 97,
    Camisas: 68,
    "Pantalón Corto": 35,
    "Pantalón Largo": 14,
    Toallas: 8,
    Gafas: 2
  },
  dailyTrajectory2025: [
    120, 310, 480, 720, 940, 1420, 1850, 2100, 2350, 2710, 3050, 3420, 3810, 4110, 4390, 4790, 5210, 5600, 6050, 6310, 6692, 
    7200, 7810, 8420, 9050, 9600, 10210, 10790, 11400, 12050, 12610, 13190, 13780, 14350, 14920, 15510, 16100, 16750, 17400, 18010, 18620, 19200, 19810, 20450, 21100, 21820, 22400, 23150, 24000, 25200, 26900, 31063.2 
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Connection keys
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('sm_supabase_url') || DEFAULT_SUPABASE_URL);
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('sm_supabase_key') || DEFAULT_SUPABASE_KEY);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // App Core State
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [stock, setStock] = useState([]);
  const [eventConfig, setEventConfig] = useState(() => {
    const saved = localStorage.getItem('sm_config');
    return saved ? JSON.parse(saved) : {
      nombre: "Sloppy Tunas Market 2026",
      objetivoVentas: 35000,
      diasTotales: 52,
      diasTranscurridos: 0,
      fechaInicio: "2026-07-01",
      fechaFin: "2026-08-31"
    };
  });

  // Dynamic Catalog State
  const [catalogCategories, setCatalogCategories] = useState(() => {
    const saved = localStorage.getItem('sm_catalog_categories');
    return saved ? JSON.parse(saved) : SEED_CATEGORIES;
  });
  const [catalogModels, setCatalogModels] = useState(() => {
    const saved = localStorage.getItem('sm_catalog_models');
    return saved ? JSON.parse(saved) : SEED_MODELS;
  });

  // --- TPV POS Local States ---
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(() => Object.keys(catalogCategories)[0] || 'Bañadores');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [activeDiscount, setActiveDiscount] = useState(0); 
  const [paymentMethod, setPaymentMethod] = useState('TARJETA');
  const [currentWorker, setCurrentWorker] = useState('Aitor');
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if logged-in worker is admin
  const isAdmin = useMemo(() => ADMIN_WORKERS.includes(currentWorker), [currentWorker]);

  // --- Daily Closing Modal ---
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [tarjetaDatafono, setTarjetaDatafono] = useState('');
  const [includeClosureDetails, setIncludeClosureDetails] = useState(true);

  // --- Catalog CRUD Admin Inputs ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatCoste, setNewCatCoste] = useState('');
  const [newCatPvp, setNewCatPvp] = useState('');
  const [newCatTallas, setNewCatTallas] = useState('S, M, L, XL');

  const [newModCategory, setNewModCategory] = useState('');
  const [newModName, setNewModName] = useState('');

  // --- Expense Logger state ---
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [gastoImporte, setGastoImporte] = useState('');
  const [gastoCategoria, setGastoCategoria] = useState('Costes varios');
  const [gastoMes, setGastoMes] = useState('Julio');

  // --- Payroll Calc state ---
  const [payrollWorker, setPayrollWorker] = useState('Joan');
  const [payrollBaseJulio, setPayrollBaseJulio] = useState('');
  const [payrollBaseAgosto, setPayrollBaseAgosto] = useState('');
  const [payrollGastos, setPayrollGastos] = useState('');
  const [payrollBonus, setPayrollBonus] = useState('');

  // Initialize Supabase Client
  const supabase = useMemo(() => {
    const isConfigured = supabaseUrl && supabaseUrl !== DEFAULT_SUPABASE_URL && supabaseKey && supabaseKey !== DEFAULT_SUPABASE_KEY;
    if (isConfigured) {
      try {
        return createClient(supabaseUrl, supabaseKey);
      } catch (e) {
        console.error("Error creating Supabase client:", e);
      }
    }
    return null;
  }, [supabaseUrl, supabaseKey]);

  // Sync state with localstorage or fetch from Supabase
  const loadData = async () => {
    setIsSyncing(true);
    if (supabase) {
      try {
        const { data: stockData, error: stockErr } = await supabase.from('stock').select('*');
        const { data: ventasData, error: ventasErr } = await supabase.from('ventas').select('*').order('created_at', { ascending: false });
        const { data: gastosData, error: gastosErr } = await supabase.from('gastos').select('*').order('created_at', { ascending: false });
        const { data: cierresData, error: cierresErr } = await supabase.from('cierres').select('*').order('fecha', { ascending: false });

        if (!stockErr && stockData) setStock(stockData);
        if (!ventasErr && ventasData) setVentas(ventasData);
        if (!gastosErr && gastosData) setGastos(gastosData);
        if (!cierresErr && cierresData) setCierres(cierresData);
        
        setIsSupabaseConnected(true);
      } catch (err) {
        console.warn("Supabase load failed. Fallback to LocalStorage.", err);
        setIsSupabaseConnected(false);
        loadFromLocalStorage();
      }
    } else {
      setIsSupabaseConnected(false);
      loadFromLocalStorage();
    }
    setIsSyncing(false);
  };

  const loadFromLocalStorage = () => {
    const savedVentas = JSON.parse(localStorage.getItem('sm_ventas') || '[]');
    const savedGastos = JSON.parse(localStorage.getItem('sm_gastos') || '[]');
    const savedCierres = JSON.parse(localStorage.getItem('sm_cierres') || '[]');
    const savedStock = JSON.parse(localStorage.getItem('sm_stock') || '[]');

    setVentas(savedVentas);
    setGastos(savedGastos);
    setCierres(savedCierres);
    
    // Seed initial stock mapping catalog if empty
    if (savedStock.length > 0) {
      setStock(savedStock);
    } else {
      const initialStock = [];
      Object.keys(catalogCategories).forEach(cat => {
        const models = catalogModels[cat] || [];
        const sizes = catalogCategories[cat].tallas;
        models.forEach(mod => {
          sizes.forEach(sz => {
            initialStock.push({
              id: `${cat}-${mod}-${sz}`,
              producto: cat,
              modelo: mod,
              talla: sz,
              cantidad_inicial: 50,
              cantidad_actual: 50
            });
          });
        });
      });
      setStock(initialStock);
      localStorage.setItem('sm_stock', JSON.stringify(initialStock));
    }
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  // Watch changes to catalog and config
  useEffect(() => {
    localStorage.setItem('sm_catalog_categories', JSON.stringify(catalogCategories));
    localStorage.setItem('sm_catalog_models', JSON.stringify(catalogModels));
  }, [catalogCategories, catalogModels]);

  useEffect(() => {
    localStorage.setItem('sm_config', JSON.stringify(eventConfig));
  }, [eventConfig]);

  // Sync actions
  const saveVentas = (newVentas) => {
    setVentas(newVentas);
    localStorage.setItem('sm_ventas', JSON.stringify(newVentas));
  };
  const saveGastos = (newGastos) => {
    setGastos(newGastos);
    localStorage.setItem('sm_gastos', JSON.stringify(newGastos));
  };
  const saveCierres = (newCierres) => {
    setCierres(newCierres);
    localStorage.setItem('sm_cierres', JSON.stringify(newCierres));
  };
  const saveStock = (newStock) => {
    setStock(newStock);
    localStorage.setItem('sm_stock', JSON.stringify(newStock));
  };

  // Reset database locally
  const handleResetDatabase = () => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
      return;
    }
    if (window.confirm("¿Seguro que deseas reiniciar la base de datos local? Esto borrará las transacciones del 2026.")) {
      localStorage.clear();
      setCatalogCategories(SEED_CATEGORIES);
      setCatalogModels(SEED_MODELS);
      loadFromLocalStorage();
      alert("Base de datos local reiniciada.");
    }
  };

  // Save connection config
  const handleSaveConnection = () => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
      return;
    }
    localStorage.setItem('sm_supabase_url', supabaseUrl);
    localStorage.setItem('sm_supabase_key', supabaseKey);
    alert("Credenciales guardadas. Intentando conectar...");
    loadData();
  };

  // Reset selections when category updates
  useEffect(() => {
    const models = catalogModels[selectedCategory] || [];
    if (models.length > 0) {
      setSelectedModel(models[0]);
    } else {
      setSelectedModel('');
    }
    const sizes = catalogCategories[selectedCategory]?.tallas || [];
    if (sizes.length > 0) {
      setSelectedSize(sizes[0]);
    } else {
      setSelectedSize('');
    }
    setCustomPrice('');
    setActiveDiscount(0);
  }, [selectedCategory, catalogCategories, catalogModels]);

  // Apply quick discount preset helper
  const getDiscountedPrice = () => {
    const basePvp = parseFloat(customPrice) || catalogCategories[selectedCategory]?.pvp || 0;
    return basePvp * (1 - activeDiscount / 100);
  };

  // POS Add to Cart
  const handleAddToCart = () => {
    if (!selectedModel || !selectedSize) {
      alert("Por favor selecciona un modelo y una talla.");
      return;
    }

    const price = getDiscountedPrice();
    const existingIndex = cart.findIndex(item => 
      item.category === selectedCategory && 
      item.model === selectedModel && 
      item.size === selectedSize &&
      item.price === price
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += selectedQty;
      updated[existingIndex].total = updated[existingIndex].qty * price;
      setCart(updated);
    } else {
      setCart([...cart, {
        id: Date.now().toString() + Math.random().toString(),
        category: selectedCategory,
        model: selectedModel,
        size: selectedSize,
        price: price,
        qty: selectedQty,
        total: price * selectedQty
      }]);
    }
    setSelectedQty(1);
    setCustomPrice('');
    setActiveDiscount(0);
  };

  // POS Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const salesToInsert = [];
    const stockUpdates = [...stock];

    cart.forEach(item => {
      salesToInsert.push({
        id: supabase ? undefined : Date.now().toString() + Math.random().toString(),
        created_at: new Date().toISOString(),
        producto: item.category,
        modelo: item.model,
        talla: item.size,
        cantidad: item.qty,
        metodo_pago: paymentMethod,
        precio: item.price,
        total: item.total,
        worker_name: currentWorker,
        cierre_id: null
      });

      const stockIdx = stockUpdates.findIndex(s => 
        s.producto === item.category && 
        s.modelo === item.model && 
        s.talla === item.size
      );
      if (stockIdx > -1) {
        stockUpdates[stockIdx].cantidad_actual = Math.max(0, stockUpdates[stockIdx].cantidad_actual - item.qty);
      }
    });

    if (supabase) {
      setIsSyncing(true);
      try {
        const { error: salesErr } = await supabase.from('ventas').insert(
          salesToInsert.map(({ id, ...rest }) => rest)
        );
        if (salesErr) throw salesErr;

        for (const item of cart) {
          const stockItem = stock.find(s => 
            s.producto === item.category && 
            s.modelo === item.model && 
            s.talla === item.size
          );
          if (stockItem) {
            const newQty = Math.max(0, stockItem.cantidad_actual - item.qty);
            await supabase.from('stock')
              .update({ cantidad_actual: newQty })
              .eq('producto', item.category)
              .eq('modelo', item.model)
              .eq('talla', item.size);
          }
        }
        await loadData();
      } catch (err) {
        alert("Fallo de conexión. Guardado en modo local.");
        saveVentas([...salesToInsert, ...ventas]);
        saveStock(stockUpdates);
      }
      setIsSyncing(true);
    } else {
      saveVentas([...salesToInsert, ...ventas]);
      saveStock(stockUpdates);
    }

    setCart([]);
    alert("Venta completada");
  };

  const handleAnnulSale = async (sale) => {
    if (!window.confirm("¿Anular venta? Se devolverá el stock.")) return;

    const stockUpdates = [...stock];
    const stockIdx = stockUpdates.findIndex(s => 
      s.producto === sale.producto && 
      s.modelo === sale.modelo && 
      s.talla === sale.talla
    );
    if (stockIdx > -1) {
      stockUpdates[stockIdx].cantidad_actual += sale.cantidad;
    }

    if (supabase) {
      setIsSyncing(true);
      try {
        await supabase.from('ventas').delete().eq('id', sale.id);
        const cur = stockUpdates[stockIdx];
        if (cur) {
          await supabase.from('stock').update({ cantidad_actual: cur.cantidad_actual }).eq('id', cur.id);
        }
        await loadData();
      } catch (err) {
        alert("Error al anular en base de datos");
      }
      setIsSyncing(false);
    } else {
      saveVentas(ventas.filter(v => v.id !== sale.id));
      saveStock(stockUpdates);
    }
  };

  // Daily closure reports
  const handleDailyClosing = async (e) => {
    e.preventDefault();
    const cash = parseFloat(efectivoContado);
    const card = parseFloat(tarjetaDatafono);
    if (isNaN(cash) || isNaN(card)) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const todaySales = ventas.filter(v => 
      v.created_at.split('T')[0] === todayStr && !v.cierre_id
    );

    const expCash = todaySales.filter(v => v.metodo_pago === 'CASH').reduce((sum, v) => sum + parseFloat(v.total), 0);
    const expCard = todaySales.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total), 0);
    const expectedTotal = expCash + expCard;

    const diff = (cash + card) - expectedTotal;

    const last = cierres[0];
    const prevAcc = last ? parseFloat(last.efectivo_acumulado) : 0;
    const newAcc = prevAcc + cash;

    const closure = {
      id: supabase ? undefined : Date.now().toString(),
      created_at: new Date().toISOString(),
      fecha: todayStr,
      efectivo_contado: cash,
      tarjeta_datafono: card,
      total_ventas_sistema: expectedTotal,
      diferencia: diff,
      efectivo_acumulado: newAcc,
      cerrado_por: currentWorker
    };

    if (supabase) {
      setIsSyncing(true);
      try {
        const { data, error } = await supabase.from('cierres').insert(closure).select();
        if (error) throw error;
        if (data && data[0]) {
          const closureId = data[0].id;
          for (const v of todaySales) {
            await supabase.from('ventas').update({ closure_id: closureId }).eq('id', v.id);
          }
        }
        await loadData();
      } catch (err) {
        alert("Fallo de conexión. Guardado en modo local.");
        saveVentas(ventas.map(v => v.created_at.split('T')[0] === todayStr ? { ...v, cierre_id: closure.id } : v));
        saveCierres([closure, ...cierres]);
      }
      setIsSyncing(false);
    } else {
      saveVentas(ventas.map(v => v.created_at.split('T')[0] === todayStr ? { ...v, cierre_id: closure.id } : v));
      saveCierres([closure, ...cierres]);
    }

    setShowClosureModal(false);
    setEfectivoContado('');
    setTarjetaDatafono('');
    alert("Cierre de caja guardado con éxito.");
  };

  // Add category to catalog (CRUD)
  const handleAddCategory = () => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
      return;
    }
    if (!newCatName || !newCatPvp || !newCatCoste) {
      alert("Por favor rellena nombre, coste y PVP.");
      return;
    }
    const sizes = newCatTallas.split(',').map(s => s.trim().toUpperCase());
    const cost = parseFloat(newCatCoste);
    const pvp = parseFloat(newCatPvp);

    setCatalogCategories({
      ...catalogCategories,
      [newCatName]: { coste: cost, pvp: pvp, tallas: sizes }
    });
    setCatalogModels({
      ...catalogModels,
      [newCatName]: []
    });

    setNewCatName('');
    setNewCatCoste('');
    setNewCatPvp('');
    alert("Categoría añadida al catálogo.");
  };

  // Remove category (CRUD)
  const handleRemoveCategory = (catName) => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar la categoría ${catName}?`)) return;
    const nextCats = { ...catalogCategories };
    delete nextCats[catName];
    const nextMods = { ...catalogModels };
    delete nextMods[catName];

    setCatalogCategories(nextCats);
    setCatalogModels(nextMods);
  };

  // Add model to category (CRUD)
  const handleAddModel = () => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
      return;
    }
    const cat = newModCategory || Object.keys(catalogCategories)[0];
    if (!newModName || !cat) {
      alert("Introduce un nombre de modelo.");
      return;
    }

    const currentModels = catalogModels[cat] || [];
    if (currentModels.includes(newModName)) {
      alert("Este modelo ya existe en la categoría.");
      return;
    }

    const updatedModels = {
      ...catalogModels,
      [cat]: [...currentModels, newModName]
    };

    setCatalogModels(updatedModels);

    const sizes = catalogCategories[cat]?.tallas || [];
    const stockUpdates = [...stock];
    sizes.forEach(sz => {
      const stockId = `${cat}-${newModName}-${sz}`;
      if (!stockUpdates.some(s => s.id === stockId)) {
        stockUpdates.push({
          id: stockId,
          producto: cat,
          modelo: newModName,
          talla: sz,
          cantidad_inicial: 50,
          cantidad_actual: 50
        });
      }
    });

    saveStock(stockUpdates);
    setNewModName('');
    alert(`Modelo ${newModName} añadido.`);
  };

  // Remove model
  const handleRemoveModel = (cat, modName) => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
      return;
    }
    if (!window.confirm(`¿Eliminar modelo ${modName}?`)) return;
    const nextMods = {
      ...catalogModels,
      [cat]: catalogModels[cat].filter(m => m !== modName)
    };
    setCatalogModels(nextMods);

    const stockUpdates = stock.filter(s => !(s.producto === cat && s.modelo === modName));
    saveStock(stockUpdates);
  };

  // Expenses management (CRUD)
  const handleAddExpense = (e) => {
    e.preventDefault();
    const imp = parseFloat(gastoImporte);
    if (!gastoConcepto || isNaN(imp)) return;

    const item = {
      id: supabase ? undefined : Date.now().toString(),
      created_at: new Date().toISOString(),
      concepto: gastoConcepto,
      importe: imp,
      categoria: gastoCategoria,
      mes: gastoMes,
      pagado: true
    };

    if (supabase) {
      supabase.from('gastos').insert(item).then(() => loadData());
    } else {
      saveGastos([item, ...gastos]);
    }

    setGastoConcepto('');
    setGastoImporte('');
    alert("Gasto registrado");
  };

  const handleRemoveExpense = async (id) => {
    if (!window.confirm("¿Eliminar gasto?")) return;
    if (supabase) {
      await supabase.from('gastos').delete().eq('id', id);
      await loadData();
    } else {
      saveGastos(gastos.filter(g => g.id !== id));
    }
  };

  // Payroll logger
  const handleCalculatePayroll = (e) => {
    e.preventDefault();
    const baseJulio = parseFloat(payrollBaseJulio) || 0;
    const baseAgosto = parseFloat(payrollBaseAgosto) || 0;
    const extra = parseFloat(payrollGastos) || 0;
    const bonus = parseFloat(payrollBonus) || 0;
    const total = baseJulio + baseAgosto + extra + bonus;

    const newG = {
      id: supabase ? undefined : Date.now().toString(),
      created_at: new Date().toISOString(),
      concepto: `Nómina ${payrollWorker} (Jul: ${baseJulio}€ / Ago: ${baseAgosto}€ + Bonus: ${bonus}€)`,
      importe: total,
      categoria: 'Nóminas',
      mes: baseAgosto > 0 ? 'Agosto' : 'Julio',
      pagado: true
    };

    if (supabase) {
      supabase.from('gastos').insert(newG).then(() => loadData());
    } else {
      saveGastos([newG, ...gastos]);
    }

    setPayrollBaseJulio('');
    setPayrollBaseAgosto('');
    setPayrollGastos('');
    setPayrollBonus('');
    alert(`Nómina de ${payrollWorker} guardada: ${total}€`);
  };

  const handleStockAdjust = (id, delta) => {
    // Only admins or designated stock actions can modify stock balances
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador (Aitor) para ajustar stock manualmente.");
      return;
    }
    const next = stock.map(s => {
      if (s.id === id) {
        return { ...s, cantidad_actual: Math.max(0, s.cantidad_actual + delta) };
      }
      return s;
    });

    if (supabase) {
      const item = next.find(s => s.id === id);
      supabase.from('stock').update({ cantidad_actual: item.cantidad_actual }).eq('id', id).then(() => loadData());
    } else {
      saveStock(next);
    }
  };

  // --- STATS AND COMPREHENSIVE KPIs ---
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today metrics
    const todaySales = ventas.filter(v => v.created_at.split('T')[0] === todayStr);
    const totalHoy = todaySales.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const cashHoy = todaySales.filter(v => v.metodo_pago === 'CASH').reduce((sum, v) => sum + parseFloat(v.total), 0);
    const cardHoy = todaySales.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total), 0);

    // Accumulated metrics
    const totalAcumulado = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalCash = ventas.filter(v => v.metodo_pago === 'CASH').reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalCard = ventas.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total), 0);

    // Dynamic Average Ticket calculation
    const transactions = {};
    ventas.forEach(v => {
      const key = `${v.worker_name}-${v.metodo_pago}-${v.created_at.slice(0, 16)}`;
      transactions[key] = (transactions[key] || 0) + parseFloat(v.total);
    });
    const txCount = Object.keys(transactions).length;
    const ticketMedio = txCount > 0 ? totalAcumulado / txCount : 0;

    // Daily averages
    const mediaDiariaReal = eventConfig.diasTranscurridos > 0 ? totalAcumulado / eventConfig.diasTranscurridos : totalAcumulado;
    const remainingDays = Math.max(0, eventConfig.diasTotales - eventConfig.diasTranscurridos);
    const remainingSales = Math.max(0, eventConfig.objetivoVentas - totalAcumulado);
    const mediaRequeridaPace = remainingDays > 0 ? remainingSales / remainingDays : 0;

    // Best/Worst Sold Model Rankings
    const modelSales = {};
    const sizeSales = {};

    ventas.forEach(v => {
      const key = `${v.producto} ${v.modelo}`;
      modelSales[key] = (modelSales[key] || 0) + parseInt(v.cantidad);
      sizeSales[v.talla] = (sizeSales[v.talla] || 0) + parseInt(v.cantidad);
    });

    const rankedModels = Object.entries(modelSales).sort((a, b) => b[1] - a[1]);
    const rankedSizes = Object.entries(sizeSales).sort((a, b) => b[1] - a[1]);

    const bestModel = rankedModels[0] ? `${rankedModels[0][0]} (${rankedModels[0][1]} uds)` : '—';
    const worstModel = rankedModels[rankedModels.length - 1] && rankedModels.length > 1
      ? `${rankedModels[rankedModels.length - 1][0]} (${rankedModels[rankedModels.length - 1][1]} uds)`
      : '—';

    const bestSize = rankedSizes[0] ? `${rankedSizes[0][0]} (${rankedSizes[0][1]} uds)` : '—';
    const worstSize = rankedSizes[rankedSizes.length - 1] && rankedSizes.length > 1
      ? `${rankedSizes[rankedSizes.length - 1][0]} (${rankedSizes[rankedSizes.length - 1][1]} uds)`
      : '—';

    const isCloseRegisteredToday = cierres.some(c => c.fecha === todayStr);

    return {
      totalHoy,
      cashHoy,
      cardHoy,
      totalAcumulado,
      totalCash,
      totalCard,
      ticketMedio,
      mediaDiariaReal,
      mediaRequeridaPace,
      remainingDays,
      bestModel,
      worstModel,
      bestSize,
      worstSize,
      isCloseRegisteredToday
    };
  }, [ventas, eventConfig, cierres]);

  // Comprehensive P&L calculation sheet
  const pnlReport = useMemo(() => {
    const standCost = gastos.filter(g => g.categoria === 'Stand').reduce((sum, g) => sum + parseFloat(g.importe), 0);
    const otherCosts = gastos.filter(g => g.categoria === 'Costes varios').reduce((sum, g) => sum + parseFloat(g.importe), 0);
    const payrollCosts = gastos.filter(g => g.categoria === 'Nóminas').reduce((sum, g) => sum + parseFloat(g.importe), 0);
    
    // Cost of Goods Sold from product seeds
    const productCost = ventas.reduce((sum, v) => {
      const catInfo = catalogCategories[v.producto];
      const cost = catInfo ? catInfo.coste : 0;
      return sum + (cost * parseInt(v.cantidad));
    }, 0);

    const cardRevenue = ventas.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total), 0);
    const vatCard = cardRevenue * 0.21;

    const totalIncomes = stats.totalAcumulado;
    const totalExpenses = standCost + otherCosts + payrollCosts + productCost + vatCard;
    const netProfit = totalIncomes - totalExpenses;
    
    const margin = totalIncomes > 0 ? (netProfit / totalIncomes) * 100 : 0;
    const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

    return {
      standCost,
      otherCosts,
      payrollCosts,
      productCost,
      vatCard,
      totalExpenses,
      netProfit,
      margin: margin.toFixed(1),
      roi: roi.toFixed(1)
    };
  }, [ventas, gastos, stats, catalogCategories]);

  // Challenge Progression Computations
  const challenges = useMemo(() => {
    // 1. Beat 2025 revenue: 31,063.20 €
    const targetRevenue = HISTORICAL_DATA.years[2025].total;
    const progressRevenue = Math.min(100, (stats.totalAcumulado / targetRevenue) * 100);

    // 2. Beat swimsuits total units of 2025: 402 units
    const targetBañadores = HISTORICAL_DATA.products2025.Bañadores;
    const currentBañadores = ventas
      .filter(v => v.producto === 'Bañadores')
      .reduce((sum, v) => sum + parseInt(v.cantidad), 0);
    const progressBañadores = Math.min(100, (currentBañadores / targetBañadores) * 100);

    // 3. Beat ticket average from 2025: 49.60 €
    const targetTicket = HISTORICAL_DATA.years[2025].ticketMedio;
    const progressTicket = targetTicket > 0 ? Math.min(100, (stats.ticketMedio / targetTicket) * 100) : 0;

    // 4. Beat August average pace of 2025: 678 €/day
    const targetAvgAugust = 678;
    const augustDailyAvg = stats.mediaDiariaReal; 
    const progressAvgAugust = Math.min(100, (augustDailyAvg / targetAvgAugust) * 100);

    return [
      { id: 1, name: "Batir ventas totales de 2025", target: `${targetRevenue.toFixed(2)} €`, current: `${stats.totalAcumulado.toFixed(2)} €`, pct: progressRevenue, active: stats.totalAcumulado >= targetRevenue },
      { id: 2, name: "Superar bañadores vendidos en 2025", target: `${targetBañadores} uds`, current: `${currentBañadores} uds`, pct: progressBañadores, active: currentBañadores >= targetBañadores },
      { id: 3, name: "Superar el ticket medio del 2025", target: `${targetTicket.toFixed(2)} €`, current: `${stats.ticketMedio.toFixed(2)} €`, pct: progressTicket, active: stats.ticketMedio >= targetTicket },
      { id: 4, name: "Batir media de facturación diaria", target: `${targetAvgAugust} €/día`, current: `${stats.mediaDiariaReal.toFixed(0)} €/día`, pct: progressAvgAugust, active: stats.mediaDiariaReal >= targetAvgAugust }
    ];
  }, [ventas, stats]);

  // Product Rentability analytics
  const productPerformance = useMemo(() => {
    const statsByProduct = {};
    Object.keys(catalogCategories).forEach(cat => {
      statsByProduct[cat] = {
        name: cat,
        unitsSold: 0,
        costUnit: catalogCategories[cat].coste,
        pvpUnit: catalogCategories[cat].pvp,
        multiplier: (catalogCategories[cat].pvp / catalogCategories[cat].coste).toFixed(1),
        revenue: 0,
        costGoodsSold: 0,
        profit: 0
      };
    });

    ventas.forEach(v => {
      if (statsByProduct[v.producto]) {
        const qty = parseInt(v.cantidad);
        const tot = parseFloat(v.total);
        statsByProduct[v.producto].unitsSold += qty;
        statsByProduct[v.producto].revenue += tot;
        statsByProduct[v.producto].costGoodsSold += qty * statsByProduct[v.producto].costUnit;
      }
    });

    const totalUnits = Object.values(statsByProduct).reduce((sum, item) => sum + item.unitsSold, 0);
    const totalProfit = Object.values(statsByProduct).reduce((sum, item) => sum + (item.revenue - item.costGoodsSold), 0);

    return Object.values(statsByProduct).map(item => {
      const profit = item.revenue - item.costGoodsSold;
      const pctUnits = totalUnits > 0 ? (item.unitsSold / totalUnits) * 100 : 0;
      const pctProfit = totalProfit > 0 ? (profit / totalProfit) * 100 : 0;
      const differenceRentability = pctProfit - pctUnits;

      return {
        ...item,
        profit,
        pctUnits: pctUnits.toFixed(1),
        pctProfit: pctProfit.toFixed(1),
        differenceRentability: differenceRentability.toFixed(1)
      };
    });
  }, [ventas, catalogCategories]);

  // Pre-aggregate cumulative sales data for interactive SVG chart
  const salesChartData = useMemo(() => {
    const dataset = [];
    let cumulative = 0;
    const paceTarget = stats.mediaRequeridaPace || (eventConfig.objetivoVentas / eventConfig.diasTotales);

    const salesByDay = {};
    ventas.forEach(v => {
      const dateStr = v.created_at.split('T')[0];
      salesByDay[dateStr] = (salesByDay[dateStr] || 0) + parseFloat(v.total);
    });

    const start = new Date(eventConfig.fechaInicio);
    const end = new Date(eventConfig.fechaFin);
    let current = new Date(start);
    let index = 1;

    while (current <= end && index <= eventConfig.diasTotales) {
      const dateStr = current.toISOString().split('T')[0];
      const salesValue = salesByDay[dateStr] || 0;
      cumulative += salesValue;

      const isPastOrToday = current <= new Date() || salesValue > 0;
      const historicalVal2025 = HISTORICAL_DATA.dailyTrajectory2025[index - 1] || null;

      dataset.push({
        dayIndex: index,
        date: dateStr,
        sales: salesValue,
        cumulative: isPastOrToday && ventas.length > 0 ? cumulative : null,
        paceTarget: paceTarget * index,
        historical2025: historicalVal2025
      });

      current.setDate(current.getDate() + 1);
      index++;
    }

    return dataset;
  }, [ventas, eventConfig, stats]);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar no-print">
        <div className="sidebar-header">
          <div className="logo-icon">ST</div>
          <div>
            <h1 className="logo-text">Sloppy Tunas</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--teal-accent)', fontWeight: 800, letterSpacing: '0.1em' }}>SUSTAINABLE APPAREL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard className="nav-item-icon" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('pos')} className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}>
            <ShoppingBag className="nav-item-icon" /> Caja TPV
          </button>
          <button onClick={() => setActiveTab('stock')} className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`}>
            <Layers className="nav-item-icon" /> Inventario
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}>
            <TrendingUp className="nav-item-icon" /> Comparativas & KPIs
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}>
            <DollarSign className="nav-item-icon" /> Gastos & P&L
          </button>
          <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <Settings className="nav-item-icon" /> Configuración {!isAdmin && <Lock size={12} style={{ marginLeft: 'auto' }} />}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isSupabaseConnected ? 'var(--teal-accent)' : 'var(--coral-accent)'
            }}></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--tuna-primary)', fontWeight: 600 }}>
              {isSupabaseConnected ? 'SUPABASE CONECTADO' : 'MODO LOCAL ACTIVO'}
            </span>
          </div>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <nav className="mobile-nav no-print">
        <a onClick={() => setActiveTab('dashboard')} className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> KPI
        </a>
        <a onClick={() => setActiveTab('pos')} className={`mobile-nav-item ${activeTab === 'pos' ? 'active' : ''}`}>
          <ShoppingBag size={20} /> TPV
        </a>
        <a onClick={() => setActiveTab('stock')} className={`mobile-nav-item ${activeTab === 'stock' ? 'active' : ''}`}>
          <Layers size={20} /> Stock
        </a>
        <a onClick={() => setActiveTab('expenses')} className={`mobile-nav-item ${activeTab === 'expenses' ? 'active' : ''}`}>
          <DollarSign size={20} /> P&L
        </a>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar no-print">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900 }}>{eventConfig.nombre}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Cajero activo: <strong>{currentWorker}</strong> ({isAdmin ? 'Administrador' : 'Vendedor'})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select 
              value={currentWorker} 
              onChange={(e) => setCurrentWorker(e.target.value)} 
              className="form-input" 
              style={{ width: 'auto', padding: '0.4rem 1.8rem 0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {DEFAULT_WORKERS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>

            <button 
              onClick={() => setShowClosureModal(true)} 
              className="btn btn-accent"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Cuadre Caja
            </button>
          </div>
        </header>

        {/* PRINT THERMAL CLOSURE LAYOUT */}
        <div className="print-receipt" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '14px', margin: '0' }}>SLOPPY TUNAS</h2>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>{eventConfig.nombre}</p>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>Fecha cierre: {new Date().toLocaleDateString()}</p>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>Cerrador por: {currentWorker}</p>
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '10px 0' }} />
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>EFECTIVO CONTADO:</span>
              <strong>{parseFloat(efectivoContado || '0').toFixed(2)} €</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TARJETA DATÁFONO:</span>
              <strong>{parseFloat(tarjetaDatafono || '0').toFixed(2)} €</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VENTAS SISTEMA:</span>
              <strong>{stats.totalHoy.toFixed(2)} €</strong>
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '5px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
              <span>DESVIACIÓN:</span>
              <span>{(parseFloat(efectivoContado || '0') + parseFloat(tarjetaDatafono || '0') - stats.totalHoy).toFixed(2)} €</span>
            </div>
          </div>
          
          {includeClosureDetails && (
            <>
              <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '10px 0' }} />
              <div style={{ fontSize: '9px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>DESGLOSE DE VENTAS HOY:</p>
                {ventas
                  .filter(v => v.created_at.split('T')[0] === new Date().toISOString().split('T')[0])
                  .map((sale, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                      <span>{sale.producto} {sale.modelo} ({sale.talla}) x{sale.cantidad}</span>
                      <span>{parseFloat(sale.total).toFixed(2)} €</span>
                    </div>
                  ))}
              </div>
            </>
          )}
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '15px 0' }} />
          <div style={{ textAlign: 'center', fontSize: '10px' }}>
            Fin del cuadre diario de caja.
          </div>
        </div>

        <section className="content-pane no-print">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="fade-in">
              {!stats.isCloseRegisteredToday && new Date().getHours() >= 19 && (
                <div className="card" style={{ borderLeft: '4px solid var(--coral-accent)', display: 'flex', alignItems: 'center', gap: '15px', padding: '1.25rem', backgroundColor: '#fff8f7' }}>
                  <AlertTriangle color="var(--coral-accent)" />
                  <div>
                    <strong style={{ color: 'var(--coral-dark)', textTransform: 'uppercase' }}>Alerta de Cierre:</strong> Cierre de caja hoy pendiente. Pulsa "CUADRE CAJA" arriba a la derecha.
                  </div>
                </div>
              )}

              {/* KPI CARD STATS */}
              <h3 style={{ marginBottom: '1.25rem' }}>Operativa de Hoy (2026)</h3>
              <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
                <div className="card stat-box">
                  <span className="stat-label">Caja Hoy (2026)</span>
                  <span className="stat-value">{stats.totalHoy.toFixed(2)} €</span>
                  <div className="stat-change">
                    <span className="badge badge-cash">{stats.cashHoy.toFixed(0)}€ Cash</span>
                    <span className="badge badge-card">{stats.cardHoy.toFixed(0)}€ Card</span>
                  </div>
                </div>
                <div className="card stat-box">
                  <span className="stat-label">Ticket Medio 2026</span>
                  <span className="stat-value">{stats.ticketMedio.toFixed(1)} €</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Historico 2025: {HISTORICAL_DATA.years[2025].ticketMedio}€</span>
                </div>
                <div className="card stat-box accent-teal">
                  <span className="stat-label">Media Diaria Real</span>
                  <span className="stat-value" style={{ color: 'var(--teal-dark)' }}>{stats.mediaDiariaReal.toFixed(0)} €</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Pace 2026: {stats.mediaRequeridaPace.toFixed(0)}€/d</span>
                </div>
                <div className="card stat-box accent-coral">
                  <span className="stat-label">Talla + Vendida</span>
                  <span className="stat-value" style={{ color: 'var(--coral-dark)' }}>{stats.bestSize.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>{stats.bestSize.slice(stats.bestSize.indexOf('('))}</span>
                </div>
              </div>

              {/* RETOS / DESAFIOS */}
              <h3 style={{ marginBottom: '1.25rem' }}>Retos de Superación YOY (vs 2025)</h3>
              <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
                {challenges.map(ch => (
                  <div key={ch.id} className="card" style={{ padding: '1.25rem', border: ch.active ? '2px solid var(--teal-accent)' : '1px solid var(--sand-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--tuna-700)', textTransform: 'uppercase' }}>{ch.name}</span>
                      <Award size={18} color={ch.active ? 'var(--teal-accent)' : 'var(--sand-300)'} />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-brand)', color: 'var(--tuna-primary)' }}>
                      {ch.current} <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>/ {ch.target}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--sand-200)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.5rem' }}>
                      <div style={{ height: '100%', width: `${ch.pct}%`, backgroundColor: ch.active ? 'var(--teal-accent)' : 'var(--tuna-primary)' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PROGRESS AND TARGETS */}
              <div className="grid grid-cols-3">
                <div className="card stat-box" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="stat-label">Objetivo Temporada 2026</span>
                    <strong style={{ color: 'var(--tuna-primary)', fontSize: '1rem' }}>
                      {stats.totalAcumulado.toFixed(2)} € / {eventConfig.objetivoVentas} € ({((stats.totalAcumulado / eventConfig.objetivoVentas) * 100).toFixed(1)}%)
                    </strong>
                  </div>
                  <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--sand-200)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.75rem' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (stats.totalAcumulado / eventConfig.objetivoVentas) * 100)}%`, backgroundColor: 'var(--teal-accent)' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                    <span>Día {eventConfig.diasTranscurridos} de {eventConfig.diasTotales} operados</span>
                    <span>{stats.remainingDays} días por delante</span>
                  </div>
                </div>

                <div className="card">
                  <h4 style={{ marginBottom: '1rem' }}>Sloppy Tunas Rankings 2026</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>Modelo Líder: <strong style={{ color: 'var(--teal-dark)' }}>{stats.bestModel}</strong></div>
                    <div style={{ borderBottom: '1px solid var(--sand-200)', paddingBottom: '0.5rem' }}>Talla Líder: <strong>{stats.bestSize}</strong></div>
                    <div style={{ paddingTop: '0.25rem' }}>Modelo Menos Vendido: <strong style={{ color: 'var(--coral-dark)' }}>{stats.worstModel}</strong></div>
                    <div>Talla Menos Vendida: <strong>{stats.worstSize}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TPV POS CASHIER */}
          {activeTab === 'pos' && (
            <div className="fade-in pos-grid">
              <div className="pos-catalog">
                {/* Easy Input Panel */}
                <div className="card" style={{ marginBottom: 0 }}>
                  <h3 style={{ marginBottom: '1.25rem' }}>Registro Rápido de Venta</h3>
                  
                  <div className="form-group">
                    <label className="form-label">1. Categoría</label>
                    <div className="selector-chip-container">
                      {Object.keys(catalogCategories).map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setSelectedCategory(cat)}
                          className={`selector-chip ${selectedCategory === cat ? 'active' : ''}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">2. Modelo</label>
                    <div className="selector-chip-container" style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--sand-200)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                      {(catalogModels[selectedCategory] || []).map(mod => (
                        <button 
                          key={mod} 
                          onClick={() => setSelectedModel(mod)}
                          className={`selector-chip ${selectedModel === mod ? 'active' : ''}`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: '2px' }}
                        >
                          {mod}
                        </button>
                      ))}
                      {(catalogModels[selectedCategory] || []).length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--tuna-600)' }}>Sin modelos registrados. Añade uno en Configuración.</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">3. Talla</label>
                    <div className="selector-chip-container">
                      {(catalogCategories[selectedCategory]?.tallas || []).map(sz => (
                        <button 
                          key={sz} 
                          onClick={() => setSelectedSize(sz)}
                          className={`selector-chip ${selectedSize === sz ? 'active' : ''}`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2" style={{ marginTop: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">4. Unidades</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>-</button>
                        <strong style={{ fontSize: '1.35rem', width: '35px', textAlign: 'center' }}>{selectedQty}</strong>
                        <button onClick={() => setSelectedQty(selectedQty + 1)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>+</button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descuentos Rápidos</label>
                      <div className="preset-grid">
                        <button onClick={() => setActiveDiscount(0)} className={`preset-btn ${activeDiscount === 0 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>0%</button>
                        <button onClick={() => setActiveDiscount(10)} className={`preset-btn ${activeDiscount === 10 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>10%</button>
                        <button onClick={() => setActiveDiscount(20)} className={`preset-btn ${activeDiscount === 20 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>20%</button>
                        <button onClick={() => setActiveDiscount(50)} className={`preset-btn ${activeDiscount === 50 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>50%</button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="form-label">Modificar PVP Unitario (Base: {catalogCategories[selectedCategory]?.pvp}€)</label>
                    <input 
                      type="number" 
                      placeholder="PVP alternativo" 
                      value={customPrice} 
                      onChange={(e) => setCustomPrice(e.target.value)} 
                      className="form-input" 
                    />
                  </div>

                  <button onClick={handleAddToCart} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    <Plus size={18} /> Añadir al ticket
                  </button>
                </div>

                {/* Today's log list */}
                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>Ventas del Turno de Hoy</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Hora</th>
                          <th>Producto</th>
                          <th>Importe</th>
                          <th>Pago</th>
                          <th>Vendedor</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventas
                          .filter(v => v.created_at.split('T')[0] === new Date().toISOString().split('T')[0])
                          .map(sale => (
                            <tr key={sale.id}>
                              <td>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td>
                                <strong>{sale.modelo}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--tuna-600)' }}>{sale.producto} · {sale.talla} (x{sale.cantidad})</div>
                              </td>
                              <td>{parseFloat(sale.total).toFixed(2)} €</td>
                              <td>
                                <span className={`badge ${sale.metodo_pago === 'CASH' ? 'badge-cash' : 'badge-card'}`}>
                                  {sale.metodo_pago}
                                </span>
                              </td>
                              <td>{sale.worker_name}</td>
                              <td>
                                <button onClick={() => handleAnnulSale(sale)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                                  Anular
                                </button>
                              </td>
                            </tr>
                          ))}
                        {ventas.filter(v => v.created_at.split('T')[0] === new Date().toISOString().split('T')[0]).length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlignment: 'center', color: 'var(--tuna-600)', padding: '2rem 0' }}>No hay ventas registradas hoy.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Shopping Ticket Cart sidebar */}
              <div className="pos-cart">
                <div className="pos-cart-header">
                  <h3>Caja Activa (Ticket)</h3>
                  <button onClick={() => setCart([])} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Limpiar</button>
                </div>

                <div className="pos-cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="pos-cart-item">
                      <div>
                        <strong>{item.model}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>
                          Talla {item.size} | {item.price.toFixed(2)}€ x {item.qty}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: '700' }}>{item.total.toFixed(2)} €</span>
                        <button onClick={() => handleRemoveFromCart(item.id)} style={{ color: 'var(--coral-accent)', cursor: 'pointer', background: 'none', border: 'none' }}>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--tuna-600)', gap: '10px' }}>
                      <ShoppingBag size={38} />
                      <span>Ticket sin artículos</span>
                    </div>
                  )}
                </div>

                <div className="pos-cart-summary">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <span>TOTAL COMPRA:</span>
                    <strong style={{ fontSize: '1.75rem', color: 'var(--tuna-primary)' }}>
                      {cart.reduce((sum, item) => sum + item.total, 0).toFixed(2)} €
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                    <button 
                      onClick={() => setPaymentMethod('TARJETA')} 
                      className={`btn ${paymentMethod === 'TARJETA' ? 'btn-primary' : 'btn-secondary'}`} 
                      style={{ flex: 1 }}
                    >
                      <CreditCard size={16} /> TARJETA
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('CASH')} 
                      className={`btn ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`} 
                      style={{ flex: 1 }}
                    >
                      <DollarSign size={16} /> CASH (EFECTIVO)
                    </button>
                  </div>

                  <button 
                    onClick={handleCheckout} 
                    disabled={cart.length === 0} 
                    className="btn btn-accent" 
                    style={{ width: '100%', padding: '1rem', color: 'var(--tuna-primary)' }}
                  >
                    Confirmar Cobro ({paymentMethod})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTARIO */}
          {activeTab === 'stock' && (
            <div className="fade-in card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Stock e Inventarios Activos</h3>
                {!isAdmin && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--coral-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Se requieren permisos de Admin para ajustar stock manual
                  </span>
                )}
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Modelo</th>
                      <th>Talla</th>
                      <th>Stock Inicial</th>
                      <th>Stock Actual</th>
                      <th>Ajustes de Caja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map(item => {
                      const pct = (item.cantidad_actual / item.cantidad_inicial) * 100;
                      let cls = 'stock-high';
                      if (item.cantidad_actual === 0) cls = 'stock-zero';
                      else if (pct <= 10) cls = 'stock-low';
                      else if (pct <= 30) cls = 'stock-med';

                      return (
                        <tr key={item.id}>
                          <td><strong>{item.producto}</strong></td>
                          <td>{item.modelo}</td>
                          <td><span className="badge" style={{ backgroundColor: 'var(--sand-200)', color: 'var(--tuna-primary)' }}>{item.talla}</span></td>
                          <td style={{ color: 'var(--tuna-600)' }}>{item.cantidad_inicial}</td>
                          <td className={cls}>{item.cantidad_actual}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                onClick={() => handleStockAdjust(item.id, -1)} 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                disabled={!isAdmin}
                              >
                                -1
                              </button>
                              <button 
                                onClick={() => handleStockAdjust(item.id, 1)} 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                disabled={!isAdmin}
                              >
                                +1
                              </button>
                              <button 
                                onClick={() => handleStockAdjust(item.id, 10)} 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                disabled={!isAdmin}
                              >
                                +10
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORICO COMPARATIVAS */}
          {activeTab === 'analytics' && (
            <div className="fade-in">
              <h3 style={{ marginBottom: '1.25rem' }}>Histórico General Comparativo Anual</h3>
              <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--sand-300)' }}>
                  <span className="stat-label">Temporada 2023</span>
                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{HISTORICAL_DATA.years[2023].total.toFixed(0)} €</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                    <div>Dias: {HISTORICAL_DATA.years[2023].dias} | Uds: {HISTORICAL_DATA.years[2023].uds}</div>
                    <div>Ticket Medio: {HISTORICAL_DATA.years[2023].ticketMedio}€</div>
                  </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--sand-300)' }}>
                  <span className="stat-label">Temporada 2024</span>
                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{HISTORICAL_DATA.years[2024].total.toFixed(0)} €</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                    <div>Dias: {HISTORICAL_DATA.years[2024].dias} | Uds: {HISTORICAL_DATA.years[2024].uds}</div>
                    <div>Ticket Medio: {HISTORICAL_DATA.years[2024].ticketMedio}€</div>
                  </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--teal-accent)' }}>
                  <span className="stat-label">Temporada 2025</span>
                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{HISTORICAL_DATA.years[2025].total.toFixed(2)} €</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                    <div>Dias: {HISTORICAL_DATA.years[2025].dias} | Uds: {HISTORICAL_DATA.years[2025].uds}</div>
                    <div>Ticket Medio: {HISTORICAL_DATA.years[2025].ticketMedio}€</div>
                  </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--tuna-primary)' }}>
                  <span className="stat-label">Temporada 2026 (Actual)</span>
                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{stats.totalAcumulado.toFixed(2)} €</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                    <div>Dias: {eventConfig.diasTranscurridos} | Uds: {ventas.reduce((s, v) => s + parseInt(v.cantidad), 0)}</div>
                    <div>Ticket Medio: {stats.ticketMedio.toFixed(1)}€</div>
                  </div>
                </div>
              </div>

              {/* Interactive YOY trajectory SVG graph */}
              <div className="card">
                <h3>Trayectoria de Ventas Acumuladas: 2026 vs 2025</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.5rem' }}>
                  Compara el progreso del 2026 (línea verde-azul) día a día con el total del año pasado 2025 (línea dorada discontinua).
                </p>
                
                <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#ffffff', border: '1px solid var(--sand-200)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <svg viewBox="0 0 600 240" style={{ width: '100%', height: '100%' }}>
                    <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" />
                    <line x1="40" y1="120" x2="580" y2="120" stroke="#f1f5f9" />
                    <line x1="40" y1="210" x2="580" y2="210" stroke="#cbd5e1" />
                    <line x1="40" y1="20" x2="40" y2="210" stroke="#cbd5e1" />

                    <text x="10" y="24" fill="var(--tuna-700)" fontSize="8">31k€</text>
                    <text x="10" y="124" fill="var(--tuna-700)" fontSize="8">15k€</text>
                    <text x="10" y="214" fill="var(--tuna-700)" fontSize="8">0€</text>

                    {/* 2025 Trajectory */}
                    {(() => {
                      const pts = salesChartData
                        .filter(d => d.historical2025 !== null)
                        .map(d => {
                          const x = 40 + (d.dayIndex / eventConfig.diasTotales) * 540;
                          const y = 210 - (d.historical2025 / 31063.2) * 190;
                          return `${x},${y}`;
                        })
                        .join(' ');
                      return <polyline fill="none" stroke="var(--amber-accent)" strokeWidth="2" strokeDasharray="4" points={pts} />;
                    })()}

                    {/* 2026 Trajectory */}
                    {(() => {
                      const pts = salesChartData
                        .filter(d => d.cumulative !== null)
                        .map(d => {
                          const x = 40 + (d.dayIndex / eventConfig.diasTotales) * 540;
                          const y = 210 - (d.cumulative / 31063.2) * 190;
                          return `${x},${y}`;
                        })
                        .join(' ');
                      if (!pts) return null;
                      return <polyline fill="none" stroke="var(--tuna-primary)" strokeWidth="3" points={pts} />;
                    })()}
                  </svg>
                </div>
              </div>

              {/* Product margins & performance */}
              <div className="card">
                <h3>Rentabilidades por Producto 2026</h3>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Mult. PVP</th>
                        <th>Coste Medio</th>
                        <th>PVP Base</th>
                        <th>Uds Vendidas</th>
                        <th>Ingresos</th>
                        <th>Margen Neto</th>
                        <th>% Uds</th>
                        <th>% Benef.</th>
                        <th>Diferencial Vol/Rent.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map(item => {
                        const d = parseFloat(item.differenceRentability);
                        const cls = d > 0 ? 'var(--teal-dark)' : d < 0 ? 'var(--coral-accent)' : 'var(--tuna-700)';

                        return (
                          <tr key={item.name}>
                            <td><strong>{item.name}</strong></td>
                            <td><span className="badge" style={{ backgroundColor: 'var(--sand-200)', color: 'var(--tuna-primary)' }}>x{item.multiplier}</span></td>
                            <td>{item.costUnit.toFixed(2)} €</td>
                            <td>{item.pvpUnit.toFixed(2)} €</td>
                            <td>{item.unitsSold} uds</td>
                            <td>{item.revenue.toFixed(2)} €</td>
                            <td style={{ color: 'var(--teal-dark)' }}>{item.profit.toFixed(2)} €</td>
                            <td>{item.pctUnits}%</td>
                            <td>{item.pctProfit}%</td>
                            <td style={{ color: cls, fontWeight: 'bold' }}>
                              {d > 0 ? `+${item.differenceRentability}` : item.differenceRentability} pp
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GASTOS & P&L */}
          {activeTab === 'expenses' && (
            <div className="fade-in">
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--tuna-primary), var(--tuna-900))', color: '#ffffff' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#ffffff' }}>Cuenta de Resultados P&L 2026</h3>
                
                <div className="grid grid-cols-3" style={{ gap: '2.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--teal-accent)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Ingresos</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ventas Totales</span>
                        <strong>{pnlReport.totalIncomes.toFixed(2)} €</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--sand-300)' }}>
                        <span>Efectivo (Cash)</span>
                        <span>{stats.totalCash.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--sand-300)' }}>
                        <span>Tarjeta (Datafono)</span>
                        <span>{stats.totalCard.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--teal-accent)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Gastos de Explotación</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Stand (Alquiler)</span>
                        <span>{pnlReport.standCost.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Nóminas Personal</span>
                        <span>{pnlReport.payrollCosts.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Coste Producto (COGS)</span>
                        <span>{pnlReport.productCost.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Costes Logística</span>
                        <span>{pnlReport.otherCosts.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>IVA Tarjeta (21%)</span>
                        <span>{pnlReport.vatCard.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--teal-accent)' }}>BENEFICIO NETO TOTAL 2026</span>
                    <h2 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0.25rem 0' }}>{pnlReport.netProfit.toFixed(2)} €</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                      <span>Margen: <strong>{pnlReport.margin}%</strong></span>
                      <span>ROI: <strong>{pnlReport.roi}%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* expense CRUD logs */}
              <div className="grid grid-cols-2">
                <div className="card">
                  <h3>Registro de Gastos Operativos</h3>
                  <form onSubmit={handleAddExpense} style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Concepto</label>
                      <input type="text" value={gastoConcepto} onChange={(e) => setGastoConcepto(e.target.value)} className="form-input" required />
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Importe (€)</label>
                        <input type="number" step="0.01" value={gastoImporte} onChange={(e) => setGastoImporte(e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Categoría</label>
                        <select value={gastoCategoria} onChange={(e) => setGastoCategoria(e.target.value)} className="form-input">
                          <option value="Stand">Alquiler Stand</option>
                          <option value="Costes varios">Costes varios / Logística</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mes</label>
                      <select value={gastoMes} onChange={(e) => setGastoMes(e.target.value)} className="form-input">
                        <option value="Julio">Julio</option>
                        <option value="Agosto">Agosto</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Registrar Gasto</button>
                  </form>

                  <div className="table-container" style={{ marginTop: '1.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th>Mes</th>
                          <th>Importe</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {gastos.map(g => (
                          <tr key={g.id}>
                            <td>{g.concepto}</td>
                            <td>{g.mes}</td>
                            <td>{parseFloat(g.importe).toFixed(2)} €</td>
                            <td>
                              <button onClick={() => handleRemoveExpense(g.id)} style={{ color: 'var(--coral-accent)', cursor: 'pointer', border: 'none', background: 'none' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3>Nóminas & Sueldos Personal</h3>
                  <form onSubmit={handleCalculatePayroll} style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Vendedor / Empleado</label>
                      <select value={payrollWorker} onChange={(e) => setPayrollWorker(e.target.value)} className="form-input">
                        {DEFAULT_WORKERS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Base Julio (€)</label>
                        <input type="number" value={payrollBaseJulio} onChange={(e) => setPayrollBaseJulio(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Base Agosto (€)</label>
                        <input type="number" value={payrollBaseAgosto} onChange={(e) => setPayrollBaseAgosto(e.target.value)} className="form-input" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Dietas a devolver (€)</label>
                        <input type="number" value={payrollGastos} onChange={(e) => setPayrollGastos(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bonus acordado (€)</label>
                        <input type="number" value={payrollBonus} onChange={(e) => setPayrollBonus(e.target.value)} className="form-input" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Generar Gasto Nómina</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="fade-in">
              {isAdmin ? (
                <>
                  {/* Dynamic Catalog CRUD Management */}
                  <div className="card">
                    <h3>Gestión del Catálogo de Productos (CRUD)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.5rem' }}>
                      Añade o quita categorías y modelos del catálogo. Los cambios se actualizarán al instante en la pantalla de la caja registradora.
                    </p>

                    <div className="grid grid-cols-2">
                      {/* Category CRUD */}
                      <div style={{ borderRight: '1px solid var(--sand-200)', paddingRight: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Añadir Categoría de Producto</h4>
                        <div className="form-group">
                          <label className="form-label">Nombre de Categoría</label>
                          <input type="text" placeholder="Ej. Gorras, Sudaderas" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="form-input" />
                        </div>

                        <div className="grid grid-cols-2">
                          <div className="form-group">
                            <label className="form-label">Coste Unitario (€)</label>
                            <input type="number" placeholder="6.50" value={newCatCoste} onChange={(e) => setNewCatCoste(e.target.value)} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">PVP Base (€)</label>
                            <input type="number" placeholder="25.00" value={newCatPvp} onChange={(e) => setNewCatPvp(e.target.value)} className="form-input" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Tallas disponibles (Separadas por comas)</label>
                          <input type="text" placeholder="S, M, L, XL" value={newCatTallas} onChange={(e) => setNewCatTallas(e.target.value)} className="form-input" />
                        </div>

                        <button onClick={handleAddCategory} className="btn btn-primary" style={{ width: '100%' }}>Añadir Categoría</button>

                        <div style={{ marginTop: '1.5rem' }}>
                          <label className="form-label">Categorías Activas:</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {Object.keys(catalogCategories).map(cat => (
                              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--sand-100)', borderRadius: 'var(--radius-sm)' }}>
                                <span><strong>{cat}</strong> (Coste: {catalogCategories[cat].coste}€ | PVP: {catalogCategories[cat].pvp}€)</span>
                                <button onClick={() => handleRemoveCategory(cat)} style={{ color: 'var(--coral-accent)', cursor: 'pointer', border: 'none', background: 'none' }}>Eliminar</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Model CRUD */}
                      <div style={{ paddingLeft: '1rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Añadir Modelo / Diseño</h4>
                        <div className="form-group">
                          <label className="form-label">Asociar a Categoría</label>
                          <select value={newModCategory} onChange={(e) => setNewModCategory(e.target.value)} className="form-input">
                            {Object.keys(catalogCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Nombre del Modelo</label>
                          <input type="text" placeholder="Ej. Stripe Blue, Classic Pink" value={newModName} onChange={(e) => setNewModName(e.target.value)} className="form-input" />
                        </div>

                        <button onClick={handleAddModel} className="btn btn-primary" style={{ width: '100%' }}>Añadir Modelo</button>

                        <div style={{ marginTop: '1.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                          <label className="form-label">Modelos Activos:</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {Object.keys(catalogCategories).map(cat => (
                              <div key={cat} style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--tuna-700)' }}>{cat.toUpperCase()}:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                  {(catalogModels[cat] || []).map(mod => (
                                    <span key={mod} className="badge" style={{ backgroundColor: 'var(--sand-200)', color: 'var(--tuna-primary)', fontSize: '0.7rem' }}>
                                      {mod}
                                      <button onClick={() => handleRemoveModel(cat, mod)} style={{ marginLeft: '6px', color: 'var(--coral-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supabase settings */}
                  <div className="card">
                    <h3>Ajustes Generales e Integraciones</h3>
                    
                    <div className="grid grid-cols-2" style={{ marginTop: '1.25rem' }}>
                      <div>
                        <h4 style={{ marginBottom: '1rem' }}>Conexión Supabase Cloud</h4>
                        <div className="form-group">
                          <label className="form-label">Supabase URL</label>
                          <input type="text" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="form-input" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Anon Public Key</label>
                          <input type="password" value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} className="form-input" />
                        </div>
                        <button onClick={handleSaveConnection} className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }}>Guardar y Conectar</button>
                        <button onClick={handleResetDatabase} className="btn btn-danger" style={{ width: '100%' }}>Reiniciar Datos Locales</button>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: '1rem' }}>Configuración del Evento</h4>
                        <div className="form-group">
                          <label className="form-label">Nombre del Evento</label>
                          <input type="text" value={eventConfig.nombre} onChange={(e) => setEventConfig({ ...eventConfig, nombre: e.target.value })} className="form-input" />
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="form-group">
                            <label className="form-label">Objetivo Ventas (€)</label>
                            <input type="number" value={eventConfig.objetivoVentas} onChange={(e) => setEventConfig({ ...eventConfig, objetivoVentas: parseInt(e.target.value) || 0 })} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Días Totales</label>
                            <input type="number" value={eventConfig.diasTotales} onChange={(e) => setEventConfig({ ...eventConfig, diasTotales: parseInt(e.target.value) || 0 })} className="form-input" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="form-group">
                            <label className="form-label">Días Transcurridos</label>
                            <input type="number" value={eventConfig.diasTranscurridos} onChange={(e) => setEventConfig({ ...eventConfig, diasTranscurridos: parseInt(e.target.value) || 0 })} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Fecha Inicio</label>
                            <input type="date" value={eventConfig.fechaInicio} onChange={(e) => setEventConfig({ ...eventConfig, fechaInicio: e.target.value })} className="form-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Lock size={48} color="var(--coral-accent)" />
                  <h3>Acceso Restringido</h3>
                  <p style={{ color: 'var(--tuna-600)', maxWidth: '400px' }}>
                    Se requieren privilegios de Administrador para modificar el catálogo de productos y conectar la base de datos de Supabase. Por favor, selecciona el cajero **Aitor** en la barra superior.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ARQUEO CAJA DIARIO REPORT MODAL */}
      {showClosureModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10,23,33,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '520px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--sand-100)', paddingBottom: '0.75rem' }}>
              <h3>Arqueo de Caja Diario</h3>
              <button onClick={() => setShowClosureModal(false)} style={{ color: 'var(--tuna-700)', cursor: 'pointer', border: 'none', background: 'none' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleDailyClosing}>
              <div className="form-group">
                <label className="form-label">Efectivo Físico Contado en Cajón (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={efectivoContado} 
                  onChange={(e) => setEfectivoContado(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tarjetas Totales Datáfono (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={tarjetaDatafono} 
                  onChange={(e) => setTarjetaDatafono(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: '1rem 0' }}>
                <input 
                  type="checkbox" 
                  id="includeDetails" 
                  checked={includeClosureDetails} 
                  onChange={(e) => setIncludeClosureDetails(e.target.checked)} 
                />
                <label htmlFor="includeDetails" className="form-label" style={{ marginBottom: 0 }}>Incluir desglose de ventas detallado</label>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--sand-100)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Ventas Registradas Sistema hoy:</span>
                  <strong>{stats.totalHoy.toFixed(2)} €</strong>
                </div>
                {efectivoContado && tarjetaDatafono && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: (parseFloat(efectivoContado) + parseFloat(tarjetaDatafono) - stats.totalHoy) >= 0 ? 'var(--teal-dark)' : 'var(--coral-accent)' }}>
                    <span>Desviación/Diferencia:</span>
                    <strong>{(parseFloat(efectivoContado) + parseFloat(tarjetaDatafono) - stats.totalHoy).toFixed(2)} €</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={triggerPrintClosure} className="btn btn-secondary">
                  <Printer size={16} /> Imprimir
                </button>
                <button type="submit" className="btn btn-accent" style={{ flex: 1, color: 'var(--tuna-primary)' }}>
                  Confirmar y Guardar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
