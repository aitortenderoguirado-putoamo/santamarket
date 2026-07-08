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
  Check,
  Search,
  Send,
  Edit3,
  UserPlus,
  Calendar,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  UserCheck
} from 'lucide-react';

// --- CONFIGURATION ---
const DEFAULT_SUPABASE_URL = "https://your-project.supabase.co";
const DEFAULT_SUPABASE_KEY = "your-anon-key";

// --- SEED CATALOG CORRECTED TO ALIGN WITH DESGLOSE ---
const SEED_CATEGORIES = {
  Bañadores: { coste: 19.0, pvp: 55.0, tallas: ['4', '6', '8', '12', 'S', 'M', 'L', 'XL', 'XXL'] },
  Camisetas: { coste: 6.0, pvp: 30.0, tallas: ['S', 'M', 'L', 'XL'] },
  Camisas: { coste: 12.0, pvp: 55.0, tallas: ['S', 'M', 'L', 'XL'] },
  "Pantalón Corto": { coste: 11.5, pvp: 55.0, tallas: ['S', 'M', 'L', 'XL'] },
  "Pantalón Largo": { coste: 14.0, pvp: 60.0, tallas: ['S', 'M', 'L', 'XL'] },
  Toallas: { coste: 10.0, pvp: 20.0, tallas: ['UNICA'] },
  Gafas: { coste: 8.0, pvp: 15.0, tallas: ['UNICA'] }
};

const SEED_MODELS = {
  Bañadores: [
    'Sea Lion', 'Turtles', 'Tunas', 'coral rojo', 'Stars', 'Coral azul', 
    'Hammer', 'Wraps', 'Microplastics', 'Amarillo', 'Straws', 'Goodvibes', 
    'Surfers', 'Sixpack', 'currents', 'Baywatch', 'Deep Blue', 'anemona', 'Crab'
  ],
  Camisetas: [
    'Catch waves', 'Out of office', 'Fuck Plastic', 'Yatch club', 'Power'
  ],
  Camisas: ['camisas Azul', 'camisas Blanca', 'camisas verde', 'camisas marron'],
  "Pantalón Corto": ['Panta Corto blanco', 'Panta Corto verde'],
  "Pantalón Largo": ['Panta Largo Blanco', 'Panta Largo kaki'],
  Toallas: ['Toalla'],
  Gafas: ['Gafas']
};

// --- REAL VERIFIED HISTORICAL SUMMARIES FROM PDF ---
const SEED_HISTORICAL_YEARS = {
  2023: { total: 8148.00, dias: 27, uds: 213, ticketMedio: 38.25 },
  2024: { total: 17422.00, dias: 51, uds: 335, ticketMedio: 52.00 },
  2025: { total: 31063.20, dias: 52, uds: 626, ticketMedio: 49.60 }
};

// --- REAL VERIFIED DAILY CUMULATIVE TRAJECTORIES FROM PDF ---
const SEED_HISTORICAL_TRAJECTORIES = {
  2023: [
    412, 461, 520, 520, 843, 932, 1050, 1125, 1302, 1772, 1858, 2083, 2473, 2620, 2865, 3385, 4002, 4139, 4550, 4755, 5089, 5467, 6053, 6692, 7138, 7884, 8148
  ],
  2024: [
    118, 522, 631, 690, 849, 1144, 1490, 1819, 2204, 2263, 2263, 2499, 2668, 2782, 3002, 3610, 3952, 4062, 4117, 4341, 4887, 5339, 6005, 6441, 6881, 7103, 7386,
    7608, 8076, 9053, 9277, 9719, 10213, 10445, 10948, 11170, 11516, 11980, 12369, 12815, 13198, 13587, 13636, 13864, 14628, 15342, 15887, 16174, 16508, 16895, 17422
  ],
  2025: [
    120, 310, 480, 720, 940, 1420, 1850, 2100, 2350, 2710, 3050, 3420, 3810, 4110, 4390, 4790, 5210, 5600, 6050, 6310, 6692, 
    7200, 7810, 8420, 9050, 9600, 10210, 10790, 11400, 12050, 12610, 13190, 13780, 14350, 14920, 15510, 16100, 16750, 17400, 18010, 18620, 19200, 19810, 20450, 21100, 21820, 22400, 23150, 24000, 25200, 26900, 31063.2
  ]
};

// --- DEFAULT WORKERS SEED LIST WITH ROLES AND PINS ---
const SEED_WORKERS = [
  { name: 'Aitor', role: 'ADMIN', pin: '1234' },
  { name: 'Marc', role: 'ADMIN', pin: '1234' },
  { name: 'Joan', role: 'CASHIER', pin: '0000' },
  { name: 'Moha', role: 'CASHIER', pin: '0000' }
];

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

  // Dynamic workers & historical years state
  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('sm_workers_profiles');
    return saved ? JSON.parse(saved) : SEED_WORKERS;
  });
  const [historicalYears, setHistoricalYears] = useState(() => {
    const saved = localStorage.getItem('sm_historical_years');
    return saved ? JSON.parse(saved) : SEED_HISTORICAL_YEARS;
  });

  // Dynamic Trajectories (Daily Sales Values) loaded from localStorage or seeded from SEED
  const [historicalDailySales, setHistoricalDailySales] = useState(() => {
    const saved = localStorage.getItem('sm_historical_daily_sales');
    if (saved) return JSON.parse(saved);

    const seeded = {};
    Object.keys(SEED_HISTORICAL_TRAJECTORIES).forEach(yr => {
      const traj = SEED_HISTORICAL_TRAJECTORIES[yr];
      seeded[yr] = traj.map((val, idx) => {
        if (idx === 0) return val;
        return Math.max(0, val - traj[idx - 1]);
      });
    });
    return seeded;
  });

  // Dynamic Cumulative Trajectories calculated on-the-fly from daily sales values
  const getCumulativeTrajectory = (year) => {
    const daily = historicalDailySales[year] || [];
    let sum = 0;
    return daily.map(d => {
      sum += d;
      return sum;
    });
  };

  // Dynamic Telegram configs
  const [telegramConfig, setTelegramConfig] = useState(() => {
    const saved = localStorage.getItem('sm_telegram');
    return saved ? JSON.parse(saved) : {
      botToken: '',
      chatId: '',
      enableOnClose: false,
      enableMorningPlan: false
    };
  });

  // --- GENERAL APP CONFIGURATIONS ---
  const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('sm_currency') || '€');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sm_dark_mode') === 'true');

  // Compare year selection for trajectory chart
  const [chartCompareYear, setChartCompareYear] = useState('2025');
  const [overlayAllYears, setOverlayAllYears] = useState(false);
  const [chartMetric, setChartMetric] = useState('cumulative'); 

  // POS Discount & promo modifiers
  const [cartDiscount, setCartDiscount] = useState(0); 

  // --- LOGIN SECURITY MODULE ---
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem('sm_active_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginSelectedUser, setLoginSelectedUser] = useState(SEED_WORKERS[0].name);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- TPV POS Local States ---
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Bañadores');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [activeDiscount, setActiveDiscount] = useState(0); 
  const [paymentMethod, setPaymentMethod] = useState('TARJETA');
  const [isSyncing, setIsSyncing] = useState(false);

  // Check role level permissions (Only admins can view costs, settings, edit catalog or edit stock cells)
  const isAdmin = useMemo(() => loggedInUser && loggedInUser.role === 'ADMIN', [loggedInUser]);

  // Force Tab Redirect for cashier role
  useEffect(() => {
    if (loggedInUser && loggedInUser.role === 'CASHIER') {
      if (activeTab === 'expenses' || activeTab === 'settings') {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, loggedInUser]);

  // --- Quick POS Catalog Edit Modal ---
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // --- Daily Sales Editor Modal ---
  const [showDailySalesEditorYear, setShowDailySalesEditorYear] = useState(null); // year string e.g. '2023'
  const [editingDailySalesValues, setEditingDailySalesValues] = useState([]); // array of daily sales

  // --- Category/Model Modification Local States ---
  const [editingCategory, setEditingCategory] = useState(null); 
  const [editCatCoste, setEditCatCoste] = useState('');
  const [editCatPvp, setEditCatPvp] = useState('');
  const [editCatTallas, setEditCatTallas] = useState('');

  const [editingModel, setEditingModel] = useState(null); 

  // --- Daily Closing Modal ---
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [tarjetaDatafono, setTarjetaDatafono] = useState('');
  const [includeClosureDetails, setIncludeClosureDetails] = useState(true);

  // --- Daily Morning Balance Modal ---
  const [showMorningModal, setShowMorningModal] = useState(false);

  // --- Inventory Search bar ---
  const [inventorySearch, setInventorySearch] = useState('');

  // --- Catalog CRUD Admin Inputs ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatCoste, setNewCatCoste] = useState('');
  const [newCatPvp, setNewCatPvp] = useState('');
  const [newCatTallas, setNewCatTallas] = useState('S, M, L, XL');

  const [newModCategory, setNewModCategory] = useState('');
  const [newModName, setNewModName] = useState('');

  // --- Worker CRUD Admin Inputs ---
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('0000');
  const [newWorkerRole, setNewWorkerRole] = useState('CASHIER');

  // --- Historical Years CRUD Admin Inputs ---
  const [newHistYear, setNewHistYear] = useState('');
  const [newHistTotal, setNewHistTotal] = useState('');
  const [newHistDias, setNewHistDias] = useState('');
  const [newHistUds, setNewHistUds] = useState('');
  const [newHistTicket, setNewHistTicket] = useState('');

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

  // Handle Login authentication
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const user = workers.find(w => w.name === loginSelectedUser);
    if (user && user.pin === loginPin) {
      setLoggedInUser(user);
      localStorage.setItem('sm_active_session', JSON.stringify(user));
      setLoginPin('');
      setLoginError('');
      setActiveTab('dashboard');
    } else {
      setLoginError('Código PIN de acceso incorrecto.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('sm_active_session');
  };

  // Dark Mode side effects
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('sm_dark_mode', darkMode);
  }, [darkMode]);

  // Reseed Stock helper
  const reseedStock = (categories = catalogCategories, models = catalogModels) => {
    const initialStock = [];
    Object.keys(categories).forEach(cat => {
      const mods = models[cat] || [];
      const sizes = categories[cat].tallas;
      mods.forEach(mod => {
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
  };

  // --- FORCE AUTO-MIGRATION OF LOCAL STORAGE FOR OUTDATED DATABASES ---
  useEffect(() => {
    let needsMigration = false;

    // 1. Check Categories
    const savedCategories = localStorage.getItem('sm_catalog_categories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        if (!parsed.hasOwnProperty('Camisetas')) {
          needsMigration = true;
        }
      } catch (e) {
        needsMigration = true;
      }
    } else {
      needsMigration = true;
    }

    // 2. Check Models
    const savedModels = localStorage.getItem('sm_catalog_models');
    if (savedModels) {
      try {
        const parsed = JSON.parse(savedModels);
        if (parsed.Bañadores && parsed.Bañadores.includes('Catch waves')) {
          needsMigration = true;
        }
        if (!parsed.hasOwnProperty('Camisetas') || parsed.Camisetas.length === 0) {
          needsMigration = true;
        }
      } catch (e) {
        needsMigration = true;
      }
    } else {
      needsMigration = true;
    }

    // 3. Perform Migration if necessary
    if (needsMigration) {
      console.log("Auto-migrating catalog cache to separate Camisetas and add child sizes...");
      setCatalogCategories(SEED_CATEGORIES);
      setCatalogModels(SEED_MODELS);
      localStorage.setItem('sm_catalog_categories', JSON.stringify(SEED_CATEGORIES));
      localStorage.setItem('sm_catalog_models', JSON.stringify(SEED_MODELS));
      reseedStock(SEED_CATEGORIES, SEED_MODELS);
    }
  }, []);

  // Sync state with localstorage or fetch from Supabase
  const loadData = async () => {
    setIsSyncing(true);
    if (supabase) {
      try {
        const { data: stockData, error: stockErr } = await supabase.from('stock').select('*');
        const { data: ventasData, error: ventasErr } = await supabase.from('ventas').select('*').order('created_at', { ascending: false });
        const { data: gastosData, error: gastosErr } = await supabase.from('gastos').select('*').order('created_at', { ascending: false });
        const { data: cierresData, error: cierresErr } = await supabase.from('cierres').select('*').order('fecha', { ascending: false });

        if (!stockErr && stockData) {
          if (stockData.length > 0) {
            setStock(stockData);
          } else {
            // Seed Supabase database on first connection if stock is empty
            const initialStock = [];
            Object.keys(catalogCategories).forEach(cat => {
              const models = catalogModels[cat] || [];
              const sizes = catalogCategories[cat].tallas;
              models.forEach(mod => {
                sizes.forEach(sz => {
                  initialStock.push({
                    producto: cat,
                    modelo: mod,
                    talla: sz,
                    cantidad_inicial: 50,
                    cantidad_actual: 50
                  });
                });
              });
            });
            const { error: seedErr } = await supabase.from('stock').insert(initialStock);
            if (!seedErr) {
              const { data: freshStock } = await supabase.from('stock').select('*');
              if (freshStock) setStock(freshStock);
            } else {
              setStock(initialStock);
            }
          }
        }
        
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
    try {
      const savedVentas = JSON.parse(localStorage.getItem('sm_ventas') || '[]');
      setVentas(Array.isArray(savedVentas) ? savedVentas : []);
    } catch(e) { setVentas([]); }

    try {
      const savedGastos = JSON.parse(localStorage.getItem('sm_gastos') || '[]');
      setGastos(Array.isArray(savedGastos) ? savedGastos : []);
    } catch(e) { setGastos([]); }

    try {
      const savedCierres = JSON.parse(localStorage.getItem('sm_cierres') || '[]');
      setCierres(Array.isArray(savedCierres) ? savedCierres : []);
    } catch(e) { setCierres([]); }
    
    try {
      const savedStock = JSON.parse(localStorage.getItem('sm_stock') || '[]');
      if (Array.isArray(savedStock) && savedStock.length > 0) {
        setStock(savedStock);
      } else {
        reseedStock();
      }
    } catch(e) {
      reseedStock();
    }
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  // --- SUPABASE REALTIME MULTI-DEVICE INSTANT SYNCHRONIZATION ---
  useEffect(() => {
    if (!supabase) return;

    const stockSub = supabase
      .channel('stock-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, () => {
        loadData();
      })
      .subscribe();

    const ventasSub = supabase
      .channel('ventas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
        loadData();
      })
      .subscribe();

    const gastosSub = supabase
      .channel('gastos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => {
        loadData();
      })
      .subscribe();

    const cierresSub = supabase
      .channel('cierres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cierres' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stockSub);
      supabase.removeChannel(ventasSub);
      supabase.removeChannel(gastosSub);
      supabase.removeChannel(cierresSub);
    };
  }, [supabase]);

  // Sync Catalog combinations with Supabase Stock rows automatically
  const syncStockWithDatabase = async (currentCats = catalogCategories, currentMods = catalogModels) => {
    if (!supabase) return;
    try {
      const { data: dbStock } = await supabase.from('stock').select('*');
      if (!dbStock) return;

      const expectedCombinations = [];
      Object.keys(currentCats).forEach(cat => {
        const models = currentMods[cat] || [];
        const sizes = currentCats[cat].tallas;
        models.forEach(mod => {
          sizes.forEach(sz => {
            expectedCombinations.push({ producto: cat, modelo: mod, talla: sz });
          });
        });
      });

      // 1. Insert new catalog additions into database
      const toInsert = expectedCombinations.filter(exp => 
        !dbStock.some(db => db.producto === exp.producto && db.modelo === exp.modelo && db.talla === exp.talla)
      ).map(exp => ({ ...exp, cantidad_inicial: 50, cantidad_actual: 50 }));

      if (toInsert.length > 0) {
        await supabase.from('stock').insert(toInsert);
      }

      // 2. Remove discontinued items from database
      const toDelete = dbStock.filter(db => 
        !expectedCombinations.some(exp => exp.producto === db.producto && exp.modelo === db.modelo && exp.talla === db.talla)
      );

      if (toDelete.length > 0) {
        for (const row of toDelete) {
          await supabase.from('stock').delete().eq('id', row.id);
        }
      }
    } catch (err) {
      console.error("Error running catalog sync on database:", err);
    }
  };

  // Watch changes to catalog and config
  useEffect(() => {
    localStorage.setItem('sm_catalog_categories', JSON.stringify(catalogCategories));
    localStorage.setItem('sm_catalog_models', JSON.stringify(catalogModels));
    if (supabase) {
      syncStockWithDatabase(catalogCategories, catalogModels);
    }
  }, [catalogCategories, catalogModels, supabase]);

  useEffect(() => {
    localStorage.setItem('sm_config', JSON.stringify(eventConfig));
  }, [eventConfig]);

  useEffect(() => {
    localStorage.setItem('sm_workers_profiles', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('sm_historical_years', JSON.stringify(historicalYears));
  }, [historicalYears]);

  useEffect(() => {
    localStorage.setItem('sm_historical_daily_sales', JSON.stringify(historicalDailySales));
  }, [historicalDailySales]);

  useEffect(() => {
    localStorage.setItem('sm_telegram', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

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

  // Telegram Send helper
  const sendTelegramNotification = async (message) => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) return;
    try {
      await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error("Error sending message to Telegram:", e);
    }
  };

  // Restore Seed Catalog
  const handleRestoreDefaultCatalog = () => {
    if (!isAdmin) {
      alert("Se requiere rol Administrador.");
      return;
    }
    if (window.confirm("¿Seguro que deseas restaurar el catálogo predeterminado de Sloppy Tunas? Se perderán las personalizaciones actuales de productos.")) {
      setCatalogCategories(SEED_CATEGORIES);
      setCatalogModels(SEED_MODELS);
      reseedStock(SEED_CATEGORIES, SEED_MODELS);
      alert("Catálogo predeterminado restaurado con éxito.");
    }
  };

  // Connection saving
  const handleSaveConnection = () => {
    localStorage.setItem('sm_supabase_url', supabaseUrl);
    localStorage.setItem('sm_supabase_key', supabaseKey);
    alert("Configuración de base de datos guardada. Cargando...");
    loadData();
  };

  // Reset database completely
  const handleResetDatabase = () => {
    if (window.confirm("¿Seguro que deseas borrar toda tu base de datos local (ventas, stock y gastos)? Esta acción no se puede deshacer.")) {
      localStorage.clear();
      alert("Datos locales borrados. Reiniciando...");
      window.location.reload();
    }
  };

  // Backup Export
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        ventas,
        gastos,
        cierres,
        stock,
        catalogCategories,
        catalogModels,
        eventConfig,
        workers,
        historicalYears,
        historicalDailySales,
        telegramConfig
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sloppy_tunas_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Backup Import
  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      try {
        const importedObj = JSON.parse(event.target.result);
        if (importedObj.ventas) setVentas(importedObj.ventas);
        if (importedObj.gastos) setGastos(importedObj.gastos);
        if (importedObj.cierres) setCierres(importedObj.cierres);
        if (importedObj.stock) setStock(importedObj.stock);
        if (importedObj.catalogCategories) setCatalogCategories(importedObj.catalogCategories);
        if (importedObj.catalogModels) setCatalogModels(importedObj.catalogModels);
        if (importedObj.eventConfig) setEventConfig(importedObj.eventConfig);
        if (importedObj.workers) setWorkers(importedObj.workers);
        if (importedObj.historicalYears) setHistoricalYears(importedObj.historicalYears);
        if (importedObj.historicalDailySales) setHistoricalDailySales(importedObj.historicalDailySales);
        if (importedObj.telegramConfig) setTelegramConfig(importedObj.telegramConfig);

        alert("Copia de seguridad importada con éxito.");
      } catch (err) {
        alert("Error al parsear el archivo. Asegúrate de usar un JSON válido de Sloppy Tunas.");
      }
    };
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0]);
    }
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
      updated[existingIndex].total = updated[updatedIndex].qty * price;
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

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const triggerPrintClosure = () => {
    window.print();
  };

  // POS Checkout - Audit trail linked to active loggedInUser
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const salesToInsert = [];
    const stockUpdates = [...stock];
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const finalTotal = Math.max(0, subtotal - cartDiscount);
    const discountRatio = subtotal > 0 ? finalTotal / subtotal : 1;

    cart.forEach(item => {
      const allocatedTotal = item.total * discountRatio;
      salesToInsert.push({
        id: supabase ? undefined : Date.now().toString() + Math.random().toString(),
        created_at: new Date().toISOString(),
        producto: item.category,
        modelo: item.model,
        talla: item.size,
        cantidad: item.qty,
        metodo_pago: paymentMethod,
        precio: item.price,
        total: allocatedTotal,
        worker_name: loggedInUser ? loggedInUser.name : 'Desconocido',
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
      setIsSyncing(false);
    } else {
      saveVentas([...salesToInsert, ...ventas]);
      saveStock(stockUpdates);
    }

    setCart([]);
    setCartDiscount(0);
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

    const expCash = todaySales.filter(v => v.metodo_pago === 'CASH').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const expCard = todaySales.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
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
      cerrado_por: loggedInUser ? loggedInUser.name : 'Desconocido'
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

    // Telegram closing notifications
    if (telegramConfig.enableOnClose && telegramConfig.botToken && telegramConfig.chatId) {
      const msg = `📦 *CIERRE DE CAJA DIARIO - Sloppy Tunas*\n\n` +
                  `📆 *Fecha:* ${todayStr}\n` +
                  `👤 *Vendedor:* ${loggedInUser ? loggedInUser.name : 'Desconocido'}\n` +
                  `-------------------------------\n` +
                  `💵 *Efectivo Contado:* ${cash.toFixed(2)} ${currencySymbol}\n` +
                  `💳 *Tarjetas Datáfono:* ${card.toFixed(2)} ${currencySymbol}\n` +
                  `📊 *Ventas Sistema:* ${expectedTotal.toFixed(2)} ${currencySymbol}\n` +
                  `⚠️ *Desviación:* ${diff.toFixed(2)} ${currencySymbol}\n` +
                  `💰 *Efectivo en Caja:* ${newAcc.toFixed(2)} ${currencySymbol}\n\n` +
                  `¡Cierre de jornada registrado con éxito!`;
      await sendTelegramNotification(msg);
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

    const updatedCategories = {
      ...catalogCategories,
      [newCatName]: { coste: cost, pvp: pvp, tallas: sizes }
    };
    const updatedModels = {
      ...catalogModels,
      [newCatName]: []
    };

    setCatalogCategories(updatedCategories);
    setCatalogModels(updatedModels);
    reseedStock(updatedCategories, updatedModels);

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
    reseedStock(nextCats, nextMods);
  };

  // Modify Category Pricing and Sizes
  const handleStartEditingCategory = (catName) => {
    const cat = catalogCategories[catName];
    if (!cat) return;
    setEditingCategory(catName);
    setEditCatCoste(cat.coste.toString());
    setEditCatPvp(cat.pvp.toString());
    setEditCatTallas(cat.tallas.join(', '));
  };

  const handleSaveCategoryEdits = () => {
    if (!editingCategory) return;
    const cost = parseFloat(editCatCoste);
    const pvp = parseFloat(editCatPvp);
    const sizes = editCatTallas.split(',').map(s => s.trim().toUpperCase());

    if (isNaN(cost) || isNaN(pvp)) {
      alert("Introduce costes y PVP válidos.");
      return;
    }

    const updatedCategories = {
      ...catalogCategories,
      [editingCategory]: { coste: cost, pvp: pvp, tallas: sizes }
    };

    setCatalogCategories(updatedCategories);
    reseedStock(updatedCategories, catalogModels);
    setEditingCategory(null);
    alert("Cambios de categoría guardados.");
  };

  // Rename or Modify Model
  const handleStartEditingModel = (category, modelName) => {
    setEditingModel({ category, oldName: modelName, newName: modelName });
  };

  const handleSaveModelEdits = () => {
    if (!editingModel) return;
    const { category, oldName, newName } = editingModel;
    if (!newName.trim()) return;

    const currentModels = catalogModels[category] || [];
    const nextModels = currentModels.map(m => m === oldName ? newName.trim() : m);
    
    const updatedModels = {
      ...catalogModels,
      [category]: nextModels
    };

    setCatalogModels(updatedModels);

    const nextStock = stock.map(s => {
      if (s.producto === category && s.modelo === oldName) {
        return {
          ...s,
          modelo: newName.trim(),
          id: `${category}-${newName.trim()}-${s.talla}`
        };
      }
      return s;
    });
    saveStock(nextStock);

    setEditingModel(null);
    alert("Modelo modificado con éxito.");
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

  // Workers dynamic management with PINs and Roles
  const handleAddWorker = () => {
    if (!isAdmin) {
      alert("Se requiere perfil Administrador.");
      return;
    }
    if (!newWorkerName || !newWorkerPin) {
      alert("Rellena nombre y PIN.");
      return;
    }
    if (workers.some(w => w.name.toLowerCase() === newWorkerName.toLowerCase())) {
      alert("Este trabajador ya existe.");
      return;
    }
    setWorkers([...workers, {
      name: newWorkerName,
      role: newWorkerRole,
      pin: newWorkerPin
    }]);
    setNewWorkerName('');
    setNewWorkerPin('0000');
    alert(`Trabajador ${newWorkerName} registrado.`);
  };

  const handleRemoveWorker = (name) => {
    if (!isAdmin) {
      alert("Se requiere perfil Administrador.");
      return;
    }
    if (name === 'Aitor' || name === 'Marc') {
      alert("Los administradores principales no pueden eliminarse.");
      return;
    }
    setWorkers(workers.filter(w => w.name !== name));
  };

  // Historical years management
  const handleAddHistYear = () => {
    if (!isAdmin) {
      alert("Se requiere perfil Administrador.");
      return;
    }
    const yr = parseInt(newHistYear);
    const tot = parseFloat(newHistTotal);
    const d = parseInt(newHistDias);
    const u = parseInt(newHistUds);
    const tk = parseFloat(newHistTicket);

    if (isNaN(yr) || isNaN(tot) || isNaN(d) || isNaN(u) || isNaN(tk)) {
      alert("Por favor rellena todos los campos con valores correctos.");
      return;
    }

    setHistoricalYears({
      ...historicalYears,
      [yr]: { total: tot, dias: d, uds: u, ticketMedio: tk }
    });

    // Seed empty daily sales for the new year
    const zeroDaily = Array(d).fill(0);
    setHistoricalDailySales({
      ...historicalDailySales,
      [yr]: zeroDaily
    });

    setNewHistYear('');
    setNewHistTotal('');
    setNewHistDias('');
    setNewHistUds('');
    setNewHistTicket('');
    alert("Histórico del año añadido.");
  };

  const handleRemoveHistYear = (yr) => {
    if (!isAdmin) {
      alert("Se requiere perfil Administrador.");
      return;
    }
    const next = { ...historicalYears };
    delete next[yr];
    setHistoricalYears(next);

    const nextDaily = { ...historicalDailySales };
    delete nextDaily[yr];
    setHistoricalDailySales(nextDaily);
  };

  // Trigger editing of individual daily sales values
  const handleStartEditingDailySales = (year) => {
    const daysCount = historicalYears[year]?.dias || 27;
    const currentDaily = historicalDailySales[year] || [];
    
    // Adjust array size dynamically to match days count metadata
    let adjusted = [...currentDaily];
    if (adjusted.length < daysCount) {
      while (adjusted.length < daysCount) adjusted.push(0);
    } else if (adjusted.length > daysCount) {
      adjusted = adjusted.slice(0, daysCount);
    }

    setEditingDailySalesValues(adjusted);
    setShowDailySalesEditorYear(year);
  };

  // Handle cell modification within the modal daily editor
  const handleDailySalesValueChange = (index, value) => {
    const next = [...editingDailySalesValues];
    const val = parseFloat(value);
    next[index] = isNaN(val) ? 0 : Math.max(0, val);
    setEditingDailySalesValues(next);
  };

  // Save edits of historical daily sales values
  const handleSaveDailySalesEdits = () => {
    if (!showDailySalesEditorYear) return;
    
    const sumTotal = editingDailySalesValues.reduce((a, b) => a + b, 0);
    
    // Update Daily sales state
    const nextDaily = {
      ...historicalDailySales,
      [showDailySalesEditorYear]: editingDailySalesValues
    };
    setHistoricalDailySales(nextDaily);

    // Prompt user to automatically synchronize metadata total
    if (window.confirm(`La suma de los días editados es de ${sumTotal.toFixed(2)} ${currencySymbol}.\n¿Deseas actualizar la facturación total del año ${showDailySalesEditorYear} con este valor?`)) {
      setHistoricalYears({
        ...historicalYears,
        [showDailySalesEditorYear]: {
          ...historicalYears[showDailySalesEditorYear],
          total: sumTotal
        }
      });
    }

    setShowDailySalesEditorYear(null);
    alert("Valores diarios históricos actualizados.");
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

  // Direct cell editing of stock actual numbers - HEALED TO PERMIT DELETION/BACKSPACE TYPING
  const handleStockCellChange = (id, value) => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador para modificar stock.");
      return;
    }
    if (value === '') {
      const next = stock.map(s => (s.id === id ? { ...s, cantidad_actual: 0 } : s));
      saveStock(next);
      return;
    }
    const qty = parseInt(value);
    if (isNaN(qty)) return;

    const next = stock.map(s => {
      if (s.id === id) {
        return { ...s, cantidad_actual: Math.max(0, qty) };
      }
      return s;
    });

    if (supabase) {
      supabase.from('stock').update({ cantidad_actual: Math.max(0, qty) }).eq('id', id).then(() => loadData());
    } else {
      saveStock(next);
    }
  };

  const handleStockAdjust = (id, delta) => {
    if (!isAdmin) {
      alert("Acceso denegado. Se requiere cuenta de Administrador.");
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
      if (item) {
        supabase.from('stock').update({ cantidad_actual: item.cantidad_actual }).eq('id', id).then(() => loadData());
      }
    } else {
      saveStock(next);
    }
  };

  // --- STATS AND COMPREHENSIVE KPIs ---
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today metrics
    const todaySales = ventas.filter(v => v.created_at.split('T')[0] === todayStr);
    const totalHoy = todaySales.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const cashHoy = todaySales.filter(v => v.metodo_pago === 'CASH').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const cardHoy = todaySales.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);

    // Accumulated metrics
    const totalAcumulado = ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const totalCash = ventas.filter(v => v.metodo_pago === 'CASH').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const totalCard = ventas.filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);

    // Dynamic Average Ticket calculation
    const transactions = {};
    ventas.forEach(v => {
      const key = `${v.worker_name}-${v.metodo_pago}-${v.created_at.slice(0, 16)}`;
      transactions[key] = (transactions[key] || 0) + parseFloat(v.total || 0);
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
      modelSales[key] = (modelSales[key] || 0) + parseInt(v.cantidad || 0);
      sizeSales[v.talla] = (sizeSales[v.talla] || 0) + parseInt(v.cantidad || 0);
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

  // Dynamic calculations for Morning Balance Recommendations
  const morningBalance = useMemo(() => {
    let sumTotal = 0;
    let sumDays = 0;
    Object.values(historicalYears).forEach(y => {
      sumTotal += y.total || 0;
      sumDays += y.dias || 0;
    });
    const histAvgDaily = sumDays > 0 ? sumTotal / sumDays : 600;

    const recommendedTarget = Math.round(histAvgDaily * 1.15);

    const swimwearStock = stock.filter(s => s.producto === 'Bañadores');
    const modelStockTotals = {};
    swimwearStock.forEach(s => {
      modelStockTotals[s.modelo] = (modelStockTotals[s.modelo] || 0) + (s.cantidad_actual || 0);
    });
    const sortedModelStock = Object.entries(modelStockTotals).sort((a, b) => b[1] - a[1]);
    const topStockedSwimwearModel = sortedModelStock[0] ? `${sortedModelStock[0][0]} (${sortedModelStock[0][1]} unidades disponibles)` : 'Ninguno';

    return {
      recommendedTarget,
      histAvgDaily: Math.round(histAvgDaily),
      topStockedSwimwearModel
    };
  }, [historicalYears, stock]);

  // Send Morning Telegram Report Trigger
  const handleSendMorningReport = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      alert("Por favor, configura Telegram en Ajustes.");
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const msg = `☀️ *BALANCE DE APERTURA DIARIA - Sloppy Tunas*\n\n` +
                `📆 *Fecha:* ${todayStr}\n` +
                `🎯 *Objetivo Diario Recomendado:* ${morningBalance.recommendedTarget} ${currencySymbol}\n` +
                `📈 *Media de Años Anteriores:* ${morningBalance.histAvgDaily} ${currencySymbol}/día\n\n` +
                `💡 *Sugerencia de Ventas (Push Product):*\n` +
                `Hoy promocionemos el bañador *${morningBalance.topStockedSwimwearModel.split(' (')[0]}*.\n` +
                `*(Es el modelo con mayor stock disponible: ${morningBalance.topStockedSwimwearModel.slice(morningBalance.topStockedSwimwearModel.indexOf('(') + 1, morningBalance.topStockedSwimwearModel.length - 1)})*.\n\n` +
                `¡A por el día y a batir las marcas! 🚀`;
    await sendTelegramNotification(msg);
    alert("Balance matutino enviado a Telegram");
  };

  // Comprehensive P&L calculation sheet (Safe calculations wrapping fallbacks)
  const pnlReport = useMemo(() => {
    const standCost = (gastos || []).filter(g => g.categoria === 'Stand').reduce((sum, g) => sum + parseFloat(g.importe || 0), 0);
    const otherCosts = (gastos || []).filter(g => g.categoria === 'Costes varios').reduce((sum, g) => sum + parseFloat(g.importe || 0), 0);
    const payrollCosts = (gastos || []).filter(g => g.categoria === 'Nóminas').reduce((sum, g) => sum + parseFloat(g.importe || 0), 0);
    
    // Cost of Goods Sold from product seeds
    const productCost = (ventas || []).reduce((sum, v) => {
      const catInfo = catalogCategories[v.producto];
      const cost = catInfo ? catInfo.coste : 0;
      return sum + (cost * parseInt(v.cantidad || 0));
    }, 0);

    const cardRevenue = (ventas || []).filter(v => v.metodo_pago === 'TARJETA').reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const vatCard = cardRevenue * 0.21;

    const totalIncomes = stats.totalAcumulado || 0;
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

  // Challenge Progression Computations (Based on dynamic historicalYears)
  const challenges = useMemo(() => {
    const prevYearData = historicalYears[2025] || { total: 31063.2, uds: 402 };
    const targetRevenue = prevYearData.total;
    const progressRevenue = Math.min(100, (stats.totalAcumulado / targetRevenue) * 100);

    const targetBañadores = prevYearData.uds || 402;
    const currentBañadores = ventas
      .filter(v => v.producto === 'Bañadores')
      .reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0);
    const progressBañadores = Math.min(100, (currentBañadores / targetBañadores) * 100);

    const targetTicket = prevYearData.ticketMedio || 49.6;
    const progressTicket = targetTicket > 0 ? Math.min(100, (stats.ticketMedio / targetTicket) * 100) : 0;

    const targetAvgAugust = 678;
    const augustDailyAvg = stats.mediaDiariaReal; 
    const progressAvgAugust = Math.min(100, (augustDailyAvg / targetAvgAugust) * 100);

    return [
      { id: 1, name: "Batir ventas totales de 2025", target: `${targetRevenue.toFixed(2)} ${currencySymbol}`, current: `${stats.totalAcumulado.toFixed(2)} ${currencySymbol}`, pct: progressRevenue, active: stats.totalAcumulado >= targetRevenue },
      { id: 2, name: "Superar bañadores vendidos en 2025", target: `${targetBañadores} uds`, current: `${currentBañadores} uds`, pct: progressBañadores, active: currentBañadores >= targetBañadores },
      { id: 3, name: "Superar el ticket medio del 2025", target: `${targetTicket.toFixed(2)} ${currencySymbol}`, current: `${stats.ticketMedio.toFixed(2)} ${currencySymbol}`, pct: progressTicket, active: stats.ticketMedio >= targetTicket },
      { id: 4, name: "Batir media de facturación diaria", target: `${targetAvgAugust} ${currencySymbol}/día`, current: `${stats.mediaDiariaReal.toFixed(0)} ${currencySymbol}/día`, pct: progressAvgAugust, active: stats.mediaDiariaReal >= targetAvgAugust }
    ];
  }, [ventas, stats, historicalYears, currencySymbol]);

  // Product Rentability analytics
  const productPerformance = useMemo(() => {
    const statsByProduct = {};
    Object.keys(catalogCategories).forEach(cat => {
      statsByProduct[cat] = {
        name: cat,
        unitsSold: 0,
        costUnit: catalogCategories[cat].coste,
        pvpUnit: catalogCategories[cat].pvp,
        multiplier: (catalogCategories[cat].pvp / (catalogCategories[cat].coste || 1)).toFixed(1),
        revenue: 0,
        costGoodsSold: 0,
        profit: 0
      };
    });

    ventas.forEach(v => {
      if (statsByProduct[v.producto]) {
        const qty = parseInt(v.cantidad || 0);
        const tot = parseFloat(v.total || 0);
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
      salesByDay[dateStr] = (salesByDay[dateStr] || 0) + parseFloat(v.total || 0);
    });

    const start = new Date(eventConfig.fechaInicio);
    const end = new Date(eventConfig.fechaFin);
    let current = new Date(start);
    let index = 1;

    const targetMaxDays = eventConfig.diasTotales || 52;
    while (current <= end && index <= targetMaxDays) {
      const dateStr = current.toISOString().split('T')[0];
      const salesValue = salesByDay[dateStr] || 0;
      cumulative += salesValue;

      const isPastOrToday = current <= new Date() || salesValue > 0;
      
      const dynamicTrajectory = getCumulativeTrajectory(chartCompareYear);
      const comparativeVal = dynamicTrajectory[index - 1] !== undefined ? dynamicTrajectory[index - 1] : null;

      dataset.push({
        dayIndex: index,
        date: dateStr,
        sales: salesValue,
        cumulative: isPastOrToday && ventas.length > 0 ? cumulative : null,
        paceTarget: paceTarget * index,
        historicalCompare: comparativeVal
      });

      current.setDate(current.getDate() + 1);
      index++;
    }

    return dataset;
  }, [ventas, eventConfig, stats, chartCompareYear, historicalDailySales]);

  // Filters stock list based on Search query
  const filteredStock = useMemo(() => {
    const q = inventorySearch.toLowerCase().trim();
    if (!q) return stock;
    return stock.filter(item => 
      item.producto.toLowerCase().includes(q) ||
      item.modelo.toLowerCase().includes(q) ||
      item.talla.toLowerCase().includes(q) ||
      `${item.producto} ${item.modelo} ${item.talla}`.toLowerCase().includes(q)
    );
  }, [stock, inventorySearch]);

  // --- LOGIN PANEL FOR UNAUTHENTICATED SESSIONS ---
  if (!loggedInUser) {
    return (
      <div className="login-screen" style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#081217',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-family)',
        color: '#f1f5f9'
      }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', backgroundColor: '#0f1c24', borderColor: '#1a2d3a', textAlign: 'center', padding: '2.5rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 1rem auto', width: '60px', height: '60px', fontSize: '2rem' }}>ST</div>
          <h2 style={{ color: '#21c4a1', marginBottom: '0.25rem' }}>Sloppy Tunas</h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.1em', fontWeight: 'bold' }}>TPV SANTA MARKET</span>
          
          <form onSubmit={handleLoginSubmit} style={{ marginTop: '2rem', textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#94a3b8' }}>Selecciona tu usuario</label>
              <select 
                value={loginSelectedUser} 
                onChange={(e) => setLoginSelectedUser(e.target.value)} 
                className="form-input"
                style={{ backgroundColor: '#142530', borderColor: '#1a2d3a', color: '#f1f5f9' }}
              >
                {workers.map(w => <option key={w.name} value={w.name}>{w.name} ({w.role === 'ADMIN' ? 'Admin' : 'Vendedor'})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#94a3b8' }}>Código PIN de Acceso</label>
              <input 
                type="password" 
                maxLength="4"
                placeholder="••••"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                className="form-input"
                style={{ backgroundColor: '#142530', borderColor: '#1a2d3a', color: '#f1f5f9', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
                required
              />
            </div>

            {loginError && (
              <div style={{ color: '#e05a47', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                ⚠️ {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '1rem', color: '#081217', fontWeight: 800 }}>
              Ingresar al TPV
            </button>
          </form>
        </div>
      </div>
    );
  }

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
          {isAdmin && (
            <button onClick={() => setActiveTab('expenses')} className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}>
              <DollarSign className="nav-item-icon" /> Gastos & P&L
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <Settings className="nav-item-icon" /> Configuración
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <UserCheck size={14} color="var(--teal-accent)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{loggedInUser.name} ({loggedInUser.role})</span>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.35rem', fontSize: '0.7rem', width: '100%' }}>
            <LogOut size={12} /> Cerrar Sesión
          </button>
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
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar no-print">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900 }}>{eventConfig.nombre}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Sesión activa: <strong>{loggedInUser.name}</strong> ({loggedInUser.role})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="btn btn-secondary" 
              style={{ padding: '0.45rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Cambiar tema de color"
            >
              {darkMode ? <Sun size={15} color="var(--amber-accent)" /> : <Moon size={15} />}
            </button>

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
            <p style={{ margin: '2px 0', fontSize: '10px' }}>Cerrador por: {loggedInUser.name}</p>
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '10px 0' }} />
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>EFECTIVO CONTADO:</span>
              <strong>{parseFloat(efectivoContado || '0').toFixed(2)} {currencySymbol}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TARJETA DATÁFONO:</span>
              <strong>{parseFloat(tarjetaDatafono || '0').toFixed(2)} {currencySymbol}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VENTAS SISTEMA:</span>
              <strong>{stats.totalHoy.toFixed(2)} {currencySymbol}</strong>
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '5px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
              <span>DESVIACIÓN:</span>
              <span>{(parseFloat(efectivoContado || '0') + parseFloat(tarjetaDatafono || '0') - stats.totalHoy).toFixed(2)} {currencySymbol}</span>
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
                      <span>{parseFloat(sale.total).toFixed(2)} {currencySymbol}</span>
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
              {/* MORNING PUSH TRIGGER PANEL */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #10677c, #073844)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Sparkles size={24} color="var(--teal-accent)" />
                  <div>
                    <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.05rem' }}>Balance y Sugerencia de Apertura de Caja</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--sand-200)' }}>Haz balance con temporadas anteriores y establece tus objetivos de hoy.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowMorningModal(true)} className="btn btn-accent" style={{ color: 'var(--tuna-950)' }}>
                    Ver Plan de Apertura
                  </button>
                  {telegramConfig.botToken && isAdmin && (
                    <button onClick={handleSendMorningReport} className="btn btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}>
                      <Send size={14} /> Enviar a Telegram
                    </button>
                  )}
                </div>
              </div>

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
                  <span className="stat-value">{stats.totalHoy.toFixed(2)} {currencySymbol}</span>
                  <div className="stat-change">
                    <span className="badge badge-cash">{stats.cashHoy.toFixed(0)}{currencySymbol} Cash</span>
                    <span className="badge badge-card">{stats.cardHoy.toFixed(0)}{currencySymbol} Card</span>
                  </div>
                </div>
                <div className="card stat-box">
                  <span className="stat-label">Ticket Medio 2026</span>
                  <span className="stat-value">{stats.ticketMedio.toFixed(1)} {currencySymbol}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Historico 2025: {(historicalYears[2025]?.ticketMedio || 49.6).toFixed(1)}{currencySymbol}</span>
                </div>
                <div className="card stat-box accent-teal">
                  <span className="stat-label">Media Diaria Real</span>
                  <span className="stat-value" style={{ color: 'var(--teal-dark)' }}>{stats.mediaDiariaReal.toFixed(0)} {currencySymbol}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Pace 2026: {stats.mediaRequeridaPace.toFixed(0)}{currencySymbol}/d</span>
                </div>
                <div className="card stat-box accent-coral">
                  <span className="stat-label">Talla + Vendida</span>
                  <span className="stat-value" style={{ color: 'var(--coral-dark)' }}>{stats.bestSize.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>{stats.bestSize.slice(stats.bestSize.indexOf('('))}</span>
                </div>
              </div>

              {/* RETOS / DESAFIOS */}
              <h3 style={{ marginBottom: '1.25rem' }}>Retos de Superación YOY</h3>
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
                      {stats.totalAcumulado.toFixed(2)} {currencySymbol} / {eventConfig.objetivoVentas} {currencySymbol} ({((stats.totalAcumulado / (eventConfig.objetivoVentas || 1)) * 100).toFixed(1)}%)
                    </strong>
                  </div>
                  <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--sand-200)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.75rem' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (stats.totalAcumulado / (eventConfig.objetivoVentas || 1)) * 100)}%`, backgroundColor: 'var(--teal-accent)' }}></div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0 }}>Registro Rápido de Venta</h3>
                    {isAdmin && (
                      <button 
                        onClick={() => setShowCatalogModal(true)} 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Edit3 size={14} /> Gestionar Catálogo
                      </button>
                    )}
                  </div>
                  
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
                      <label className="form-label">Descuentos Rápidos (Unitario)</label>
                      <div className="preset-grid">
                        <button onClick={() => setActiveDiscount(0)} className={`preset-btn ${activeDiscount === 0 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>0%</button>
                        <button onClick={() => setActiveDiscount(10)} className={`preset-btn ${activeDiscount === 10 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>10%</button>
                        <button onClick={() => setActiveDiscount(20)} className={`preset-btn ${activeDiscount === 20 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>20%</button>
                        <button onClick={() => setActiveDiscount(50)} className={`preset-btn ${activeDiscount === 50 ? 'btn-primary' : ''}`} style={{ border: 'none' }}>50%</button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="form-label">Modificar PVP Unitario (Base: {catalogCategories[selectedCategory]?.pvp}{currencySymbol})</label>
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
                              <td>{parseFloat(sale.total || 0).toFixed(2)} {currencySymbol}</td>
                              <td>
                                <span className={`badge ${sale.metodo_pago === 'CASH' ? 'badge-cash' : 'badge-card'}`}>
                                  {sale.metodo_pago}
                                </span>
                              </td>
                              <td>{sale.worker_name}</td>
                              <td>
                                <button onClick={() => handleAnnulSale(sale)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7.rem' }}>
                                  Anular
                                </button>
                              </td>
                            </tr>
                          ))}
                        {ventas.filter(v => v.created_at.split('T')[0] === new Date().toISOString().split('T')[0]).length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--tuna-600)', padding: '2rem 0' }}>No hay ventas registradas hoy.</td>
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
                  <button onClick={() => { setCart([]); setCartDiscount(0); }} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Limpiar</button>
                </div>

                <div className="pos-cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="pos-cart-item">
                      <div>
                        <strong>{item.model}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>
                          Talla {item.size} | {item.price.toFixed(2)}{currencySymbol} x {item.qty}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: '700' }}>{item.total.toFixed(2)} {currencySymbol}</span>
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

                {/* Discounts Section */}
                <div className="pos-cart-discounts" style={{ padding: '1rem', borderTop: '1px solid var(--sand-200)', backgroundColor: 'var(--sand-100)' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Descuentos de Ticket</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setCartDiscount(cartDiscount === 10 ? 0 : 10)} 
                      className={`btn ${cartDiscount === 10 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.4rem', flex: 1 }}
                    >
                      Promo 2ª Ud (-10€)
                    </button>
                    <button 
                      onClick={() => setCartDiscount(0)} 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem', flex: 0.5 }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>

                <div className="pos-cart-summary">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--tuna-600)' }}>Subtotal:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cart.reduce((sum, item) => sum + item.total, 0).toFixed(2)} {currencySymbol}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--coral-accent)', fontSize: '0.85rem' }}>
                      <span>Descuento Aplicado:</span>
                      <strong>-{cartDiscount.toFixed(2)} {currencySymbol}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', borderTop: '1px solid var(--sand-200)', paddingTop: '0.5rem' }}>
                    <span>TOTAL COMPRA:</span>
                    <strong style={{ fontSize: '1.75rem', color: 'var(--tuna-primary)' }}>
                      {Math.max(0, cart.reduce((sum, item) => sum + item.total, 0) - cartDiscount).toFixed(2)} {currencySymbol}
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
                      <DollarSign size={16} /> CASH
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Stock e Inventario Activo</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>
                    {isAdmin ? 'Modifica las casillas numéricas directamente según lo que tengas en el stand.' : 'Consulta la disponibilidad de modelos y tallas.'}
                  </span>
                </div>
                
                {/* SEARCH BAR */}
                <div style={{ position: 'relative', width: '300px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tuna-600)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar producto, modelo o talla..." 
                    value={inventorySearch} 
                    onChange={(e) => setInventorySearch(e.target.value)} 
                    className="form-input" 
                    style={{ paddingLeft: '2.25rem', margin: 0 }}
                  />
                </div>
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
                      {isAdmin && <th>Ajustar</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map(item => {
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
                          <td className={cls} style={{ width: '130px' }}>
                            {isAdmin ? (
                              <input 
                                type="number" 
                                value={item.cantidad_actual === 0 ? '' : item.cantidad_actual} 
                                placeholder="0"
                                onChange={(e) => handleStockCellChange(item.id, e.target.value)}
                                className="stock-edit-input"
                                style={{ width: '65px', textAlign: 'center', border: '1px solid var(--sand-300)', borderRadius: '4px', padding: '2px' }}
                              />
                            ) : (
                              <span style={{ fontWeight: 'bold' }}>{item.cantidad_actual} uds</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleStockAdjust(item.id, -1)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>-1</button>
                                <button onClick={() => handleStockAdjust(item.id, 1)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>+1</button>
                                <button onClick={() => handleStockAdjust(item.id, 10)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>+10</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredStock.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: 'var(--tuna-600)', padding: '2rem 0' }}>Ningún producto coincide con el filtro de búsqueda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORICO COMPARATIVAS */}
          {activeTab === 'analytics' && (
            <div className="fade-in">
              {/* Year over Year Comparison cards */}
              <h3 style={{ marginBottom: '1.25rem' }}>Histórico General Comparativo Anual</h3>
              <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
                {Object.keys(historicalYears).map(yr => (
                  <div key={yr} className="card" style={{ borderLeft: '4px solid var(--sand-300)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="stat-label">Temporada {yr}</span>
                      {isAdmin && (
                        <button onClick={() => handleRemoveHistYear(yr)} style={{ color: 'var(--coral-accent)', border: 'none', background: 'none', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <span className="stat-value" style={{ fontSize: '1.75rem' }}>{(historicalYears[yr].total || 0).toFixed(0)} {currencySymbol}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                      <div>Dias: {historicalYears[yr].dias} | Uds: {historicalYears[yr].uds}</div>
                      <div>Ticket Medio: {historicalYears[yr].ticketMedio}{currencySymbol}</div>
                    </div>
                  </div>
                ))}
                
                {/* Current Year */}
                <div className="card" style={{ borderLeft: '4px solid var(--tuna-primary)' }}>
                  <span className="stat-label">Temporada 2026 (Actual)</span>
                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{stats.totalAcumulado.toFixed(2)} {currencySymbol}</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tuna-600)', marginTop: '0.5rem' }}>
                    <div>Dias: {eventConfig.diasTranscurridos} | Uds: {ventas.reduce((s, v) => s + parseInt(v.cantidad || 0), 0)}</div>
                    <div>Ticket Medio: {stats.ticketMedio.toFixed(1)}{currencySymbol}</div>
                  </div>
                </div>
              </div>

              {/* Interactive YOY trajectory SVG graph */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {chartMetric === 'cumulative' ? 'Trayectoria de Ventas Acumuladas' : 'Evolución de Caja / Venta Diaria'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', margin: 0 }}>
                      {chartMetric === 'cumulative' 
                        ? 'Compara el progreso acumulado día a día de las temporadas.' 
                        : 'Compara la facturación neta ingresada individualmente en cada día de mercado.'
                      }
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    {/* METRIC TYPE SELECTOR */}
                    <div style={{ display: 'flex', border: '1px solid var(--sand-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <button 
                        onClick={() => setChartMetric('cumulative')} 
                        className="btn" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 0, margin: 0, border: 'none', backgroundColor: chartMetric === 'cumulative' ? 'var(--tuna-primary)' : 'transparent', color: chartMetric === 'cumulative' ? '#fff' : 'var(--tuna-700)' }}
                      >
                        Acumulado
                      </button>
                      <button 
                        onClick={() => setChartMetric('daily')} 
                        className="btn" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 0, margin: 0, border: 'none', backgroundColor: chartMetric === 'daily' ? 'var(--tuna-primary)' : 'transparent', color: chartMetric === 'daily' ? '#fff' : 'var(--tuna-700)' }}
                      >
                        Caja Diaria
                      </button>
                    </div>

                    {/* OVERLAY CHECKBOX (CONJUNTO vs SEPARADO) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        id="overlayCheck" 
                        checked={overlayAllYears} 
                        onChange={(e) => setOverlayAllYears(e.target.checked)} 
                      />
                      <label htmlFor="overlayCheck" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.8rem' }}>Superponer todos los años</label>
                    </div>

                    {!overlayAllYears && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Comparar con:</span>
                        <select 
                          value={chartCompareYear} 
                          onChange={(e) => setChartCompareYear(e.target.value)} 
                          className="form-input" 
                          style={{ margin: 0, width: 'auto', padding: '0.25rem 1.75rem 0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          {Object.keys(historicalYears).map(yr => <option key={yr} value={yr}>{yr}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#ffffff', border: '1px solid var(--sand-200)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <svg viewBox="0 0 600 240" style={{ width: '100%', height: '100%' }}>
                    <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" />
                    <line x1="40" y1="120" x2="580" y2="120" stroke="#f1f5f9" />
                    <line x1="40" y1="210" x2="580" y2="210" stroke="#cbd5e1" />
                    <line x1="40" y1="20" x2="40" y2="210" stroke="#cbd5e1" />

                    {/* Y-axis Labels */}
                    {chartMetric === 'cumulative' ? (
                      <>
                        <text x="10" y="24" fill="var(--tuna-700)" fontSize="8">31k€</text>
                        <text x="10" y="124" fill="var(--tuna-700)" fontSize="8">15k€</text>
                        <text x="10" y="214" fill="var(--tuna-700)" fontSize="8">0€</text>
                      </>
                    ) : (
                      <>
                        <text x="10" y="24" fill="var(--tuna-700)" fontSize="8">{maxDailyY}€</text>
                        <text x="10" y="124" fill="var(--tuna-700)" fontSize="8">{(maxDailyY / 2).toFixed(0)}€</text>
                        <text x="10" y="214" fill="var(--tuna-700)" fontSize="8">0€</text>
                      </>
                    )}

                    {/* CHART LINES RENDERER */}
                    {chartMetric === 'cumulative' ? (
                      /* --- CUMULATIVE TRAJECTORY LINES --- */
                      overlayAllYears ? (
                        <>
                          {/* 2023 Line (Amber) */}
                          {(() => {
                            const pts = getCumulativeTrajectory(2023).map((val, idx) => {
                              const x = 40 + ((idx + 1) / 52) * 540;
                              const y = 210 - (val / 31063.2) * 190;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3" points={pts} />;
                          })()}
                          {/* 2024 Line (Blue) */}
                          {(() => {
                            const pts = getCumulativeTrajectory(2024).map((val, idx) => {
                              const x = 40 + ((idx + 1) / 52) * 540;
                              const y = 210 - (val / 31063.2) * 190;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3" points={pts} />;
                          })()}
                          {/* 2025 Line (Red) */}
                          {(() => {
                            const pts = getCumulativeTrajectory(2025).map((val, idx) => {
                              const x = 40 + ((idx + 1) / 52) * 540;
                              const y = 210 - (val / 31063.2) * 190;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3" points={pts} />;
                          })()}
                        </>
                      ) : (
                        /* Single comparative YOY line */
                        (() => {
                          const pts = salesChartData
                            .filter(d => d.historicalCompare !== null)
                            .map(d => {
                              const x = 40 + (d.dayIndex / 52) * 540;
                              const y = 210 - (d.historicalCompare / 31063.2) * 190;
                              return `${x},${y}`;
                            })
                            .join(' ');
                          return <polyline fill="none" stroke="var(--amber-accent)" strokeWidth="2" strokeDasharray="4" points={pts} />;
                        })()
                      )
                    ) : (
                      /* --- DAILY INDIVIDUAL SALES LINES --- */
                      overlayAllYears ? (
                        <>
                          {/* 2023 Daily (Amber) */}
                          {(() => {
                            const pts = (historicalDailySales[2023] || []).map((val, idx) => {
                              const x = 40 + ((idx + 1) / 52) * 540;
                              const y = 210 - (val / maxDailyY) * 190;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2" points={pts} />;
                          })()}
                          {/* 2024 Daily (Blue) */}
                          {(() => {
                            const pts = (historicalDailySales[2024] || []).map((val, idx) => {
                              const x = 40 + ((idx + 1) / 52) * 540;
                              const y = 210 - (val / maxDailyY) * 190;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2" points={pts} />;
                          })()}
                          {/* 2025 Daily (Red) */}
                          {(() => {
                            const pts = (historicalDailySales[2025] || []).map((val, idx) => {
                              const x = 40 + ((idx + 1) / 52) * 540;
                              const y = 210 - (val / maxDailyY) * 190;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2" points={pts} />;
                          })()}
                        </>
                      ) : (
                        /* Single Compared YOY Daily line */
                        (() => {
                          const traj = historicalDailySales[chartCompareYear] || [];
                          const pts = traj.map((val, idx) => {
                            const x = 40 + ((idx + 1) / 52) * 540;
                            const y = 210 - (val / maxDailyY) * 190;
                            return `${x},${y}`;
                          }).join(' ');
                          return <polyline fill="none" stroke="var(--amber-accent)" strokeWidth="1.5" strokeDasharray="3" points={pts} />;
                        })()
                      )
                    )}

                    {/* 2026 Line (Teal) - Renders for both cumulative or daily neta sales */}
                    {chartMetric === 'cumulative' ? (
                      (() => {
                        const pts = salesChartData
                          .filter(d => d.cumulative !== null)
                          .map(d => {
                            const x = 40 + (d.dayIndex / 52) * 540;
                            const y = 210 - (d.cumulative / 31063.2) * 190;
                            return `${x},${y}`;
                          })
                          .join(' ');
                        return pts ? <polyline fill="none" stroke="var(--tuna-primary)" strokeWidth="3" points={pts} /> : null;
                      })()
                    ) : (
                      (() => {
                        const pts = salesChartData
                          .filter(d => d.dayIndex <= eventConfig.diasTranscurridos || d.sales > 0)
                          .map(d => {
                            const x = 40 + (d.dayIndex / 52) * 540;
                            const y = 210 - (d.sales / maxDailyY) * 190;
                            return `${x},${y}`;
                          })
                          .join(' ');
                        return pts ? <polyline fill="none" stroke="var(--tuna-primary)" strokeWidth="2.5" points={pts} /> : null;
                      })()
                    )}
                  </svg>
                </div>
                
                {/* Graph Legend */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--tuna-primary)', display: 'inline-block' }}></span> 2026 (Actual)
                  </span>
                  {overlayAllYears ? (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '12px', height: '3px', backgroundColor: '#fbbf24', display: 'inline-block' }}></span> 2023
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '12px', height: '3px', backgroundColor: '#3b82f6', display: 'inline-block' }}></span> 2024
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '12px', height: '3px', backgroundColor: '#ef4444', display: 'inline-block' }}></span> 2025
                      </span>
                    </>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--amber-accent)', display: 'inline-block' }}></span> {chartCompareYear}
                    </span>
                  )}
                </div>
              </div>

              {/* DAILY AVERAGE COMPARISON TABLE */}
              <div className="card">
                <h3>Facturación Media Diaria YOY vs Año Actual</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.25rem' }}>
                  Compara el ritmo diario de ventas promedio de este año con los resultados históricos reales.
                </p>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Año Temporada</th>
                        <th>Facturación Total</th>
                        <th>Días Operados</th>
                        <th>Venta Media Diaria</th>
                        <th>Comparado con 2026</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(historicalYears).map(yr => {
                        const data = historicalYears[yr];
                        const avg = data.total / (data.dias || 1);
                        const curAvg = stats.mediaDiariaReal;
                        const diffPct = avg > 0 ? ((curAvg - avg) / avg) * 100 : 0;
                        const isHigher = curAvg >= avg;

                        return (
                          <tr key={yr}>
                            <td><strong>Temporada {yr}</strong></td>
                            <td>{parseFloat(data.total || 0).toFixed(2)} {currencySymbol}</td>
                            <td>{data.dias} días</td>
                            <td style={{ color: 'var(--tuna-primary)', fontWeight: 'bold' }}>{avg.toFixed(2)} {currencySymbol}/día</td>
                            <td style={{ color: isHigher ? 'var(--teal-dark)' : 'var(--coral-accent)', fontWeight: 'bold' }}>
                              {diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ backgroundColor: 'rgba(33,196,161,0.06)' }}>
                        <td><strong>Temporada 2026 (Actual)</strong></td>
                        <td>{stats.totalAcumulado.toFixed(2)} {currencySymbol}</td>
                        <td>{eventConfig.diasTranscurridos} días</td>
                        <td style={{ color: 'var(--teal-dark)', fontWeight: 'bold' }}>{stats.mediaDiariaReal.toFixed(2)} {currencySymbol}/día</td>
                        <td style={{ color: 'var(--tuna-700)', fontWeight: 'bold' }}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Product performance */}
              <div className="card">
                <h3>Rentabilidades por Producto 2026</h3>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Mult. PVP</th>
                        {isAdmin && <th>Coste Medio</th>}
                        <th>PVP Base</th>
                        <th>Uds Vendidas</th>
                        <th>Ingresos</th>
                        {isAdmin && <th>Margen Neto</th>}
                        <th>% Uds</th>
                        <th>% Benef.</th>
                        <th>Diferencial Vol/Rent.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map(item => {
                        const d = parseFloat(item.differenceRentability || 0);
                        const cls = d > 0 ? 'var(--teal-dark)' : d < 0 ? 'var(--coral-accent)' : 'var(--tuna-700)';

                        return (
                          <tr key={item.name}>
                            <td><strong>{item.name}</strong></td>
                            <td><span className="badge" style={{ backgroundColor: 'var(--sand-200)', color: 'var(--tuna-primary)' }}>x{item.multiplier}</span></td>
                            {isAdmin && <td>{(item.costUnit || 0).toFixed(2)} {currencySymbol}</td>}
                            <td>{(item.pvpUnit || 0).toFixed(2)} {currencySymbol}</td>
                            <td>{item.unitsSold} uds</td>
                            <td>{(item.revenue || 0).toFixed(2)} {currencySymbol}</td>
                            {isAdmin && <td style={{ color: 'var(--teal-dark)' }}>{(item.profit || 0).toFixed(2)} {currencySymbol}</td>}
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
          {activeTab === 'expenses' && isAdmin && (
            <div className="fade-in">
              {/* Dynamic P&L Account */}
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--tuna-primary), var(--tuna-900))', color: '#ffffff' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#ffffff' }}>Cuenta de Resultados P&L 2026</h3>
                
                <div className="grid grid-cols-3" style={{ gap: '2.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--teal-accent)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Ingresos</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ventas Totales</span>
                        <strong>{(pnlReport.totalIncomes || 0).toFixed(2)} {currencySymbol}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--sand-300)' }}>
                        <span>Efectivo (Cash)</span>
                        <span>{stats.totalCash.toFixed(2)} {currencySymbol}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--sand-300)' }}>
                        <span>Tarjeta (Datafono)</span>
                        <span>{stats.totalCard.toFixed(2)} {currencySymbol}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--teal-accent)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Gastos de Explotación</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Stand (Alquiler)</span>
                        <span>{(pnlReport.standCost || 0).toFixed(2)} {currencySymbol}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Nóminas Personal</span>
                        <span>{(pnlReport.payrollCosts || 0).toFixed(2)} {currencySymbol}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Coste Producto (COGS)</span>
                        <span>{(pnlReport.productCost || 0).toFixed(2)} {currencySymbol}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Costes Logística</span>
                        <span>{(pnlReport.otherCosts || 0).toFixed(2)} {currencySymbol}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>IVA Tarjeta (21%)</span>
                        <span>{(pnlReport.vatCard || 0).toFixed(2)} {currencySymbol}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--teal-accent)' }}>BENEFICIO NETO TOTAL 2026</span>
                    <h2 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0.25rem 0' }}>{(pnlReport.netProfit || 0).toFixed(2)} {currencySymbol}</h2>
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
                        <label className="form-label">Importe ({currencySymbol})</label>
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
                        {(gastos || []).map(g => (
                          <tr key={g.id}>
                            <td>{g.concepto}</td>
                            <td>{g.mes}</td>
                            <td>{parseFloat(g.importe || 0).toFixed(2)} {currencySymbol}</td>
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
                        {workers.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Base Julio ({currencySymbol})</label>
                        <input type="number" value={payrollBaseJulio} onChange={(e) => setPayrollBaseJulio(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Base Agosto ({currencySymbol})</label>
                        <input type="number" value={payrollBaseAgosto} onChange={(e) => setPayrollBaseAgosto(e.target.value)} className="form-input" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Dietas a devolver ({currencySymbol})</label>
                        <input type="number" value={payrollGastos} onChange={(e) => setPayrollGastos(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bonus acordado ({currencySymbol})</label>
                        <input type="number" value={payrollBonus} onChange={(e) => setPayrollBonus(e.target.value)} className="form-input" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Generar Gasto Nómina</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONFIGURACION */}
          {activeTab === 'settings' && isAdmin && (
            <div className="fade-in">
              <div className="grid grid-cols-2">
                
                {/* Workers Card with Login PIN CRUD */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <UserPlus size={20} color="var(--tuna-primary)" />
                    <h3>Gestión de Trabajadores del Turno</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.25rem' }}>
                    Añade o elimina perfiles de vendedores asignándoles un PIN de 4 dígitos para acceder al TPV.
                  </p>
                  
                  <div style={{ backgroundColor: 'var(--sand-100)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div className="grid grid-cols-3" style={{ gap: '8px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Nombre</label>
                        <input type="text" placeholder="Ej. Sofia" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="form-input" style={{ margin: 0 }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Rol</label>
                        <select value={newWorkerRole} onChange={(e) => setNewWorkerRole(e.target.value)} className="form-input" style={{ margin: 0 }}>
                          <option value="CASHIER">Vendedor</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">PIN (4 Digitos)</label>
                        <input type="text" maxLength="4" placeholder="0000" value={newWorkerPin} onChange={(e) => setNewWorkerPin(e.target.value)} className="form-input" style={{ margin: 0 }} />
                      </div>
                    </div>
                    <button onClick={handleAddWorker} className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <Plus size={16} /> Registrar Empleado
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {workers.map(w => (
                      <div key={w.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: 'var(--sand-100)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{w.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--tuna-600)', marginLeft: '10px' }}>
                            PIN: <code>{w.pin}</code> | Rol: <strong>{w.role}</strong>
                          </span>
                        </div>
                        {w.name !== 'Aitor' && w.name !== 'Marc' && (
                          <button onClick={() => handleRemoveWorker(w.name)} style={{ color: 'var(--coral-accent)', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telegram notifications config */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <Send size={20} color="var(--teal-accent)" />
                    <h3>Notificaciones de Telegram</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.25rem' }}>
                    Recibe el cuadre de caja de cada día en el grupo de chat al instante y balances de previsión matutinos.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Telegram Bot Token</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 123456:ABC-DEF..." 
                      value={telegramConfig.botToken} 
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Chat ID de Grupo/Canal</label>
                    <input 
                      type="text" 
                      placeholder="Ej. -100123456789" 
                      value={telegramConfig.chatId} 
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })} 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      id="tgClose" 
                      checked={telegramConfig.enableOnClose} 
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, enableOnClose: e.target.checked })} 
                    />
                    <label htmlFor="tgClose" className="form-label" style={{ marginBottom: 0 }}>Enviar reporte al confirmar cuadre de caja</label>
                  </div>

                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', margin: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      id="tgMorning" 
                      checked={telegramConfig.enableMorningPlan} 
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, enableMorningPlan: e.target.checked })} 
                    />
                    <label htmlFor="tgMorning" className="form-label" style={{ marginBottom: 0 }}>Enviar previsión matutina automáticamente</label>
                  </div>
                </div>
              </div>

              {/* General Application Config Card (Currency & Backups) */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                  <Settings size={20} color="var(--tuna-primary)" />
                  <h3>Preferencias y Copias de Seguridad</h3>
                </div>
                <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
                  
                  {/* Currency settings */}
                  <div>
                    <label className="form-label">Símbolo de Moneda</label>
                    <select 
                      value={currencySymbol} 
                      onChange={(e) => { setCurrencySymbol(e.target.value); localStorage.setItem('sm_currency', e.target.value); }} 
                      className="form-input"
                    >
                      <option value="€">Euro (€)</option>
                      <option value="$">Dólar ($)</option>
                      <option value="£">Libra (£)</option>
                    </select>
                  </div>

                  {/* Backup export/import */}
                  <div>
                    <label className="form-label">Copias de Seguridad (Local)</label>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <button onClick={handleExportBackup} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <Download size={15} /> Exportar JSON
                      </button>
                      <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                        <Upload size={15} /> Importar Copia
                        <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>

                  {/* Seed Restore */}
                  <div>
                    <label className="form-label">Restablecer Aplicación</label>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <button onClick={handleRestoreDefaultCatalog} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--coral-accent)' }}>
                        <RefreshCw size={15} /> Restaurar Catálogo Semilla
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Historical Years CRUD (Admin) with Dynamic Daily Sales Editing */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <Calendar size={20} color="var(--tuna-primary)" />
                  <h3>Ajuste de Años Históricos YOY</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.25rem' }}>
                  Configura los balances históricos y edita los valores de las cajas diarias de otras campañas.
                </p>

                <div className="grid grid-cols-5" style={{ gap: '8px', marginBottom: '1.5rem' }}>
                  <input type="number" placeholder="Año" value={newHistYear} onChange={(e) => setNewHistYear(e.target.value)} className="form-input" style={{ margin: 0 }} />
                  <input type="number" placeholder="Total Facturado" value={newHistTotal} onChange={(e) => setNewHistTotal(e.target.value)} className="form-input" style={{ margin: 0 }} />
                  <input type="number" placeholder="Días Abiertos" value={newHistDias} onChange={(e) => setNewHistDias(e.target.value)} className="form-input" style={{ margin: 0 }} />
                  <input type="number" placeholder="Uds Vendidas" value={newHistUds} onChange={(e) => setNewHistUds(e.target.value)} className="form-input" style={{ margin: 0 }} />
                  <button onClick={handleAddHistYear} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <Plus size={16} /> Añadir
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.keys(historicalYears).map(yr => (
                    <div key={yr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--sand-100)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <strong>Temporada {yr}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--tuna-600)', marginLeft: '10px' }}>
                          Facturación: {historicalYears[yr].total}€ | Días: {historicalYears[yr].dias} | Uds: {historicalYears[yr].uds}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleStartEditingDailySales(yr)} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          ✏️ Editar Caja Diaria
                        </button>
                        <button 
                          onClick={() => handleRemoveHistYear(yr)} 
                          style={{ color: 'var(--coral-accent)', cursor: 'pointer', border: 'none', background: 'none' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database integrations */}
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
            </div>
          )}
        </section>
      </main>

      {/* QUICK CATALOG CRUD DIALOG MODAL (ACCESIBLE DIRECTAMENTE DESDE TPV CAJA) */}
      {showCatalogModal && isAdmin && (
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
          <div className="card fade-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--sand-100)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="var(--tuna-primary)" />
                <h3 style={{ margin: 0 }}>Ajustar Catálogo de Productos</h3>
              </div>
              <button onClick={() => setShowCatalogModal(false)} style={{ color: 'var(--tuna-700)', cursor: 'pointer', border: 'none', background: 'none' }}>
                <X size={22} />
              </button>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
              {/* Category CRUD */}
              <div style={{ borderRight: '1px solid var(--sand-200)', paddingRight: '1.5rem' }}>
                
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

                {/* Listing Active Categories with Inline MODIFICATION */}
                <div style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Categorías y Precios Activos:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {Object.keys(catalogCategories).map(cat => (
                      <div key={cat} style={{ padding: '0.75rem', backgroundColor: 'var(--sand-100)', borderRadius: 'var(--radius-sm)', border: editingCategory === cat ? '1px solid var(--teal-accent)' : '1px solid var(--sand-200)' }}>
                        {editingCategory === cat ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong>Editando {cat}</strong>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input type="number" placeholder="Coste" value={editCatCoste} onChange={(e) => setEditCatCoste(e.target.value)} className="form-input" style={{ margin: 0, fontSize: '0.75rem', padding: '0.25rem' }} />
                              <input type="number" placeholder="PVP" value={editCatPvp} onChange={(e) => setEditCatPvp(e.target.value)} className="form-input" style={{ margin: 0, fontSize: '0.75rem', padding: '0.25rem' }} />
                            </div>
                            <input type="text" placeholder="Tallas" value={editCatTallas} onChange={(e) => setEditCatTallas(e.target.value)} className="form-input" style={{ margin: 0, fontSize: '0.75rem', padding: '0.25rem' }} />
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                              <button onClick={handleSaveCategoryEdits} className="btn btn-primary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem' }}>Guardar</button>
                              <button onClick={() => setEditingCategory(null)} className="btn btn-secondary" style={{ flex: 0.5, fontSize: '0.7rem', padding: '0.25rem' }}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{cat}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--tuna-600)' }}>
                                Coste: {catalogCategories[cat].coste}€ | PVP: {catalogCategories[cat].pvp}€
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleStartEditingCategory(cat)} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>Modificar</button>
                              <button onClick={() => handleRemoveCategory(cat)} style={{ color: 'var(--coral-accent)', cursor: 'pointer', border: 'none', background: 'none', fontSize: '0.8rem' }}>Eliminar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model CRUD */}
              <div>
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

                {/* Model Listing with MODIFICATION support */}
                <div style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                  <label className="form-label">Modelos Activos por Categoría:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {Object.keys(catalogCategories).map(cat => (
                      <div key={cat} style={{ borderBottom: '1px solid var(--sand-200)', paddingBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--tuna-700)' }}>{cat.toUpperCase()}:</span>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {(catalogModels[cat] || []).map(mod => (
                            <span key={mod} className="badge" style={{ backgroundColor: 'var(--sand-200)', color: 'var(--tuna-primary)', fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              
                              {editingModel && editingModel.category === cat && editingModel.oldName === mod ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input 
                                    type="text" 
                                    value={editingModel.newName} 
                                    onChange={(e) => setEditingModel({ ...editingModel, newName: e.target.value })} 
                                    style={{ fontSize: '0.7rem', padding: '1px 3px', border: '1px solid var(--teal-accent)', borderRadius: '2px', width: '80px' }}
                                  />
                                  <button onClick={handleSaveModelEdits} style={{ border: 'none', background: 'none', color: 'var(--teal-dark)', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                                  <button onClick={() => setEditingModel(null)} style={{ border: 'none', background: 'none', color: 'var(--coral-accent)', cursor: 'pointer' }}>×</button>
                                </span>
                              ) : (
                                <>
                                  {mod}
                                  <button onClick={() => handleStartEditingModel(cat, mod)} style={{ color: 'var(--tuna-primary)', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.65rem' }} title="Modificar nombre">✎</button>
                                  <button onClick={() => handleRemoveModel(cat, mod)} style={{ color: 'var(--coral-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                                </>
                              )}

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
        </div>
      )}

      {/* HISTORICAL DAILY SALES EDITOR DIALOG MODAL (ADMIN ONLY) */}
      {showDailySalesEditorYear && isAdmin && (
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
          zIndex: 110,
          padding: '1rem'
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyIntent: 'space-between', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--sand-100)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--teal-accent)" />
                <h3 style={{ margin: 0 }}>Editor de Caja Diaria - Temporada {showDailySalesEditorYear}</h3>
              </div>
              <button onClick={() => setShowDailySalesEditorYear(null)} style={{ color: 'var(--tuna-700)', cursor: 'pointer', border: 'none', background: 'none' }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--tuna-600)', marginBottom: '1.5rem' }}>
              Modifica los valores netos ingresados cada día individual. La curva y el acumulado total YOY se recalcularán automáticamente.
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-6" style={{ gap: '10px', maxHeight: '450px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--sand-200)', borderRadius: 'var(--radius-md)' }}>
              {editingDailySalesValues.map((val, idx) => (
                <div key={idx} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--tuna-700)' }}>Día {idx + 1}</label>
                  <input 
                    type="number" 
                    value={val === 0 ? '' : val} 
                    placeholder="0"
                    onChange={(e) => handleDailySalesValueChange(idx, e.target.value)} 
                    className="form-input" 
                    style={{ padding: '0.35rem', fontSize: '0.8rem', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--sand-100)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>Suma Total Calculada:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--teal-dark)', marginLeft: '10px' }}>
                  {editingDailySalesValues.reduce((a, b) => a + b, 0).toFixed(2)} {currencySymbol}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowDailySalesEditorYear(null)} className="btn btn-secondary">Cancelar</button>
                <button onClick={handleSaveDailySalesEdits} className="btn btn-accent" style={{ color: 'var(--tuna-primary)' }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label className="form-label">Efectivo Físico Contado en Cajón ({currencySymbol})</label>
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
                <label className="form-label">Tarjetas Totales Datáfono ({currencySymbol})</label>
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
                  <strong>{stats.totalHoy.toFixed(2)} {currencySymbol}</strong>
                </div>
                {efectivoContado && tarjetaDatafono && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: (parseFloat(efectivoContado) + parseFloat(tarjetaDatafono) - stats.totalHoy) >= 0 ? 'var(--teal-dark)' : 'var(--coral-accent)' }}>
                    <span>Desviación/Diferencia:</span>
                    <strong>{(parseFloat(efectivoContado) + parseFloat(tarjetaDatafono) - stats.totalHoy).toFixed(2)} {currencySymbol}</strong>
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

      {/* DAILY MORNING BALANCE TARGET MODAL */}
      {showMorningModal && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--teal-accent)" />
                <h3>Previsión y Balance Diario</h3>
              </div>
              <button onClick={() => setShowMorningModal(false)} style={{ color: 'var(--tuna-700)', cursor: 'pointer', border: 'none', background: 'none' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span className="stat-label">Objetivo Diario Recomendado hoy:</span>
                <div style={{ fontSize: '2rem', color: 'var(--teal-dark)', fontFamily: 'var(--font-brand)', margin: '0.25rem 0' }}>
                  {morningBalance.recommendedTarget} {currencySymbol}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>
                  Calculado aplicando un +15% de mejora sobre la media diaria de años anteriores ({morningBalance.histAvgDaily} {currencySymbol}/día).
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--sand-200)', paddingTop: '1rem' }}>
                <span className="stat-label">Bañador sugerido a vender hoy (Push Product):</span>
                <div style={{ fontSize: '1.2rem', color: 'var(--tuna-primary)', fontFamily: 'var(--font-brand)', margin: '0.25rem 0' }}>
                  {morningBalance.topStockedSwimwearModel.split(' (')[0]}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--tuna-600)' }}>
                  Sugerido automáticamente por ser el modelo de bañador con mayor unidades disponibles en el stock ({morningBalance.topStockedSwimwearModel.slice(morningBalance.topStockedSwimwearModel.indexOf('(') + 1, morningBalance.topStockedSwimwearModel.length - 1)}).
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button onClick={() => setShowMorningModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cerrar
                </button>
                {telegramConfig.botToken && isAdmin && (
                  <button onClick={handleSendMorningReport} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <Send size={16} /> Enviar a Telegram
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
