import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ─── Image upload helper ────────────────────────────────────────────────────
const IMG_API = 'https://api.imgbb.com/1/upload?key=f551092ea99ba4836b1e1df45314cd1f';
async function uploadImage(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please upload an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('File must be under 5 MB.');
  const fd = new FormData(); fd.append('image', file);
  const r = await fetch(IMG_API, { method:'POST', body:fd });
  const d = await r.json();
  if (!d.success) throw new Error(d.error?.message || 'Upload failed.');
  return d.data.url;
}

const STATUS_ORDER = ['Pending', 'Preparing', 'Ready', 'Delivered'];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#faf9f6;}
/* HEADER */
.adm-hdr{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,122,51,0.1);box-shadow:0 2px 20px rgba(0,0,0,0.06);}
.adm-hdr-in{max-width:1400px;margin:0 auto;padding:.85rem 2rem;display:flex;align-items:center;justify-content:space-between;}
.logo-wrap{display:flex;align-items:center;gap:.75rem;}
.logo-icon{width:40px;height:40px;background:linear-gradient(145deg,#FF7A33,#FF5500);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,107,0,0.3);flex-shrink:0;}
.logo-brand{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:800;color:#2d1f0e;line-height:1;}
.logo-sub{font-size:.62rem;color:#FF7A33;font-weight:600;letter-spacing:2px;text-transform:uppercase;}
.admin-badge{background:linear-gradient(135deg,#2d1f0e,#3d2a14);color:#FFAA77;font-size:.72rem;font-weight:700;padding:.25rem .7rem;border-radius:999px;letter-spacing:1px;text-transform:uppercase;margin-left:.6rem;}
.back-btn{display:flex;align-items:center;gap:.4rem;padding:.5rem 1rem;background:#f5f5f0;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;color:#374151;cursor:pointer;transition:all .2s ease;}
.back-btn:hover{background:#fff;border-color:rgba(255,122,51,0.3);color:#FF7A33;}
/* STATS */
.stats-bar{background:linear-gradient(135deg,#2d1f0e,#3d2a14,#4a3020);padding:1.5rem 2rem;position:relative;overflow:hidden;}
.stats-bar::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(255,122,51,0.15),transparent 60%);}
.stats-in{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;position:relative;z-index:1;}
.stat-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:1rem 1.25rem;backdrop-filter:blur(8px);transition:background .2s;}
.stat-card:hover{background:rgba(255,255,255,0.13);}
.stat-lbl{font-size:.72rem;color:rgba(255,255,255,0.55);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:.4rem;}
.stat-val{font-family:'Playfair Display',serif;font-size:1.75rem;font-weight:800;color:white;line-height:1;}
.stat-sub{font-size:.72rem;color:#FFAA77;font-weight:500;margin-top:.25rem;}
/* TABS */
.tabs-wrap{max-width:1400px;margin:0 auto;padding:1.5rem 2rem 0;display:flex;gap:.5rem;border-bottom:2px solid #ede8e0;}
.tab-btn{display:flex;align-items:center;gap:.5rem;padding:.7rem 1.4rem;background:none;border:none;border-radius:10px 10px 0 0;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;color:#9ca3af;cursor:pointer;transition:all .2s;position:relative;bottom:-2px;}
.tab-btn:hover{color:#FF7A33;background:rgba(255,122,51,0.06);}
.tab-btn.active{color:#FF7A33;background:#faf9f6;border:2px solid #ede8e0;border-bottom:2px solid #faf9f6;}
.tab-bdg{font-size:.68rem;font-weight:800;padding:.15rem .45rem;border-radius:999px;min-width:20px;text-align:center;}
.bdg-orange{background:#FF7A33;color:white;}
.bdg-amber{background:#f59e0b;color:white;}
.bdg-gray{background:#6b7280;color:white;}
/* MAIN */
.adm-main{max-width:1400px;margin:0 auto;padding:2rem;}
/* Layout */
.menu-layout{display:grid;grid-template-columns:350px 1fr;gap:1.5rem;align-items:start;}
/* Panel */
.panel{background:white;border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,0.06);border:1px solid rgba(255,122,51,0.08);overflow:hidden;}
.panel-hdr{padding:1.1rem 1.5rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:.5rem;}
.panel-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#2d1f0e;}
.panel-body{padding:1.5rem;}
/* Upload zone */
.upload-zone{border:2px dashed rgba(255,122,51,0.4);border-radius:12px;padding:1.25rem;text-align:center;cursor:pointer;transition:all .2s;background:#fdf9f5;position:relative;min-height:100px;display:flex;align-items:center;justify-content:center;}
.upload-zone:hover,.upload-zone.drag{background:#fff3ec;border-color:#FF7A33;}
.upload-zone.has-img{padding:0;overflow:hidden;height:110px;}
.upload-preview{width:100%;height:100%;object-fit:cover;border-radius:10px;}
.upload-clear{position:absolute;top:6px;right:6px;background:#FF5500;color:white;border:none;border-radius:50%;width:24px;height:24px;font-size:1rem;cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1;}
.upload-lbl{font-size:.82rem;color:#FF7A33;font-weight:600;cursor:pointer;}
.upload-hint{font-size:.72rem;color:#b0b8c1;margin-top:.25rem;}
/* Fields */
.fstack{display:flex;flex-direction:column;gap:.75rem;margin-top:1rem;}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
.adm-inp,.adm-sel{width:100%;padding:.75rem 1rem;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#1f2937;background:#fafafa;outline:none;transition:border-color .2s,box-shadow .2s;}
.adm-inp:focus,.adm-sel:focus{border-color:#FF7A33;background:#fff;box-shadow:0 0 0 3px rgba(255,122,51,0.12);}
.adm-inp::placeholder{color:#c4c4c4;}
.inp-hint{font-size:.72rem;color:#9ca3af;margin-top:.25rem;}
/* Buttons */
.btn-primary{width:100%;padding:.8rem;background:linear-gradient(135deg,#FF7A33,#FF5500);color:white;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;margin-top:1rem;box-shadow:0 4px 14px rgba(255,107,0,0.3);transition:transform .15s,box-shadow .15s;display:flex;align-items:center;justify-content:center;gap:.4rem;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(255,107,0,0.4);}
.btn-primary:disabled{background:#d1d5db;box-shadow:none;transform:none;cursor:not-allowed;}
.btn-sec{flex:1;padding:.75rem;background:#f5f5f0;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;color:#6b7280;cursor:pointer;transition:all .2s;}
.btn-sec:hover{border-color:#d1d5db;color:#374151;}
/* Menu list */
.list-panel{background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);border:1px solid rgba(255,122,51,0.08);}
.list-hdr{padding:1rem 1.5rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;}
.list-title{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:#2d1f0e;}
.list-count{font-size:.78rem;font-weight:600;color:#9ca3af;background:#f5f5f0;padding:.2rem .55rem;border-radius:999px;}
.menu-scroll{max-height:600px;overflow-y:auto;}
.menu-scroll::-webkit-scrollbar{width:4px;}
.menu-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px;}
/* Item row */
.item-row{display:flex;align-items:center;gap:.85rem;padding:.85rem 1.5rem;border-bottom:1px solid #f9f9f7;transition:background .15s;}
.item-row:last-child{border-bottom:none;}
.item-row:hover{background:#fdf9f5;}
.item-thumb{width:54px;height:54px;object-fit:cover;border-radius:10px;flex-shrink:0;border:1px solid #f0f0f0;}
.item-info{flex:1;min-width:0;}
.item-name{font-size:.88rem;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.item-meta{font-size:.72rem;color:#9ca3af;font-weight:500;margin-top:2px;display:flex;align-items:center;gap:.5rem;}
.item-price{font-size:.88rem;font-weight:800;color:#FF7A33;white-space:nowrap;}
.item-acts{display:flex;gap:.35rem;align-items:center;}
.icon-btn{width:30px;height:30px;border-radius:8px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s;font-size:.75rem;}
.icon-btn:hover{transform:scale(1.1);}
.btn-edit{background:#eff6ff;color:#3b82f6;}
.btn-del{background:#fff1f0;color:#ef4444;}
/* OUT OF STOCK TOGGLE */
.oos-toggle{display:flex;align-items:center;gap:.4rem;padding:.3rem .65rem;border-radius:8px;border:1.5px solid transparent;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;}
.oos-toggle.in-stock{background:#dcfce7;color:#16a34a;border-color:rgba(22,163,74,0.2);}
.oos-toggle.in-stock:hover{background:#bbf7d0;}
.oos-toggle.out-stock{background:#fee2e2;color:#dc2626;border-color:rgba(220,38,38,0.2);}
.oos-toggle.out-stock:hover{background:#fecaca;}
/* ORDERS */
.orders-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem;}
.ocard{background:white;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #f0f0f0;overflow:hidden;transition:transform .2s,box-shadow .2s;}
.ocard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.09);}
.ocard-top{padding:1rem 1.25rem .75rem;border-bottom:1px solid #f5f5f0;display:flex;justify-content:space-between;align-items:flex-start;}
.ocard-id{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:#2d1f0e;}
.ocard-body{padding:.85rem 1.25rem;}
.odet-row{display:flex;align-items:flex-start;gap:.5rem;margin-bottom:.4rem;}
.odet-icon{font-size:.8rem;margin-top:1px;flex-shrink:0;}
.odet-txt{font-size:.8rem;color:#6b7280;line-height:1.4;}
.odet-txt strong{color:#374151;font-weight:600;}
.oitems{background:#faf9f6;border-radius:8px;padding:.6rem .75rem;margin:.6rem 0;}
.oitem-line{font-size:.78rem;color:#6b7280;padding:.2rem 0;display:flex;justify-content:space-between;}
.oitem-line:not(:last-child){border-bottom:1px solid #f0f0f0;}
.ototal{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:800;color:#FF7A33;margin-top:.6rem;}
/* ETA in order card */
.order-eta{display:inline-flex;align-items:center;gap:.3rem;background:#fef3c7;color:#d97706;font-size:.72rem;font-weight:700;padding:.25rem .6rem;border-radius:6px;margin-top:.4rem;}
.status-pill{font-size:.7rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:.3rem .7rem;border-radius:999px;}
.s-Pending{background:#fef3c7;color:#d97706;}
.s-Preparing{background:#dbeafe;color:#2563eb;}
.s-Ready{background:#dcfce7;color:#16a34a;}
.s-Delivered{background:#f3f4f6;color:#6b7280;}
.status-btns{display:flex;gap:.4rem;flex-wrap:wrap;padding:.85rem 1.25rem;border-top:1px solid #f5f5f0;}
.sbtn{flex:1;min-width:70px;padding:.45rem .5rem;border-radius:8px;border:1.5px solid transparent;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .15s;text-align:center;}
.sbtn:disabled{opacity:.45;cursor:not-allowed;}
.sb-Pending{background:#fef3c7;color:#d97706;border-color:rgba(217,119,6,0.2);}
.sb-Pending:not(:disabled):hover{background:#fde68a;}
.sb-Preparing{background:#dbeafe;color:#2563eb;border-color:rgba(37,99,235,0.2);}
.sb-Preparing:not(:disabled):hover{background:#bfdbfe;}
.sb-Ready{background:#dcfce7;color:#16a34a;border-color:rgba(22,163,74,0.2);}
.sb-Ready:not(:disabled):hover{background:#bbf7d0;}
.sb-Delivered{background:#f3f4f6;color:#6b7280;border-color:rgba(107,114,128,0.2);}
.sb-Delivered:not(:disabled):hover{background:#e5e7eb;}
/* MODAL */
.modal-bg{position:fixed;inset:0;background:rgba(30,15,0,0.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease;}
.modal-box{background:white;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.2);padding:2rem;width:420px;max-width:95vw;animation:scaleIn .25s ease;}
.modal-title{font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:700;color:#2d1f0e;margin-bottom:1.25rem;}
.modal-acts{display:flex;gap:.75rem;margin-top:1rem;}
/* Empty */
.empty-st{text-align:center;padding:3.5rem 2rem;color:#9ca3af;}
.empty-icon{font-size:3rem;margin-bottom:.75rem;}
.empty-title{font-family:'Playfair Display',serif;font-size:1.1rem;color:#6b7280;margin-bottom:.35rem;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes scaleIn{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:scale(1);}}
@keyframes spin{to{transform:rotate(360deg);}}
`;

// ── UploadZone Component ──────────────────────────────────────────────────
function UploadZone({ imageUrl, onUpload, onClear, id }) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const handle = async (file) => {
    setUploading(true);
    try { await onUpload(file); } catch (e) { alert('❌ ' + e.message); } finally { setUploading(false); }
  };
  return (
    <div className={`upload-zone${imageUrl ? ' has-img' : ''}${drag ? ' drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}>
      {imageUrl ? (
        <><img src={imageUrl} alt="preview" className="upload-preview" /><button className="upload-clear" onClick={onClear}>×</button></>
      ) : uploading ? (
        <div style={{ color:'#FF7A33', fontSize:'.85rem', fontWeight:600 }}>Uploading…</div>
      ) : (
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#FF7A33" strokeWidth="1.5" style={{ marginBottom:6 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <div className="upload-lbl">
            <input type="file" accept="image/*" id={id} style={{ display:'none' }} onChange={e => handle(e.target.files[0])} />
            <label htmlFor={id} style={{ cursor:'pointer' }}>Click to upload</label> or drag & drop
          </div>
          <div className="upload-hint">JPG, PNG · Max 5 MB</div>
        </div>
      )}
    </div>
  );
}

// ── EditModal Component ───────────────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item.name, price: item.price.toString(),
    category: item.category, imageUrl: item.imageUrl || '',
    prepTime: item.prepTime?.toString() || '10',
    description: item.description || ''
  });
  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.name || isNaN(price) || price <= 0) { alert('Fill name and valid price.'); return; }
    await onSave({ ...item, ...form, price, prepTime: parseInt(form.prepTime) || 10 });
  };
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">✏️ Edit Menu Item</div>
        <UploadZone id="edit-upload" imageUrl={form.imageUrl}
          onUpload={async f => { const url = await uploadImage(f); setForm(p => ({ ...p, imageUrl: url })); }}
          onClear={() => setForm(p => ({ ...p, imageUrl: '' }))} />
        <div className="fstack">
          <input className="adm-inp" placeholder="Dish name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <input className="adm-inp" placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div className="frow">
            <div>
              <input className="adm-inp" type="number" placeholder="Price (₹)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <input className="adm-inp" type="number" placeholder="Prep time (mins)" min="1" max="120" value={form.prepTime} onChange={e => setForm(p => ({ ...p, prepTime: e.target.value }))} />
              <div className="inp-hint">Used to calculate ETA for customers</div>
            </div>
          </div>
          <select className="adm-sel" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            <option value="">Select Category</option>
            {['Breakfast','Lunch','Snacks','Beverages','Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="modal-acts">
          <button className="btn-primary" style={{ marginTop:0 }} onClick={handleSave}>Save Changes</button>
          <button className="btn-sec" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [newItem, setNewItem] = useState({ name:'', price:'', category:'', imageUrl:'', prepTime:'10', description:'' });
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchMenu(); fetchOrders(); }, []);

  const fetchMenu = async () => {
    try { const r = await axios.get('http://localhost:5000/api/menu'); setMenu(r.data); } catch(e) { console.error(e); }
  };
  const fetchOrders = async () => {
    try { const r = await axios.get('http://localhost:5000/api/orders'); setOrders(r.data); } catch(e) { console.error(e); }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) { alert('Fill name and price'); return; }
    const price = parseFloat(newItem.price);
    if (isNaN(price) || price <= 0) { alert('Enter a valid price'); return; }
    try {
      await axios.post('http://localhost:5000/api/menu', {
        ...newItem, price,
        prepTime: parseInt(newItem.prepTime) || 10,
        inStock: true       // ← default to in-stock
      });
      setNewItem({ name:'', price:'', category:'', imageUrl:'', prepTime:'10', description:'' });
      fetchMenu();
    } catch(e) { alert('Failed to add item.'); }
  };

  const updateMenuItem = async (updated) => {
    try {
      await axios.put(`http://localhost:5000/api/menu/${updated.id}`, {
        name:updated.name, price:updated.price, category:updated.category,
        imageUrl:updated.imageUrl, prepTime:updated.prepTime, description:updated.description
      });
      setEditingItem(null); fetchMenu();
    } catch(e) { alert('Failed to update.'); }
  };

  // ── FEATURE 2: Toggle stock status ──────────────────────────────────────
  const toggleStock = async (item) => {
    const newStatus = item.inStock === false ? true : false;   // flip
    try {
      await axios.put(`http://localhost:5000/api/menu/${item.id}/stock`, { inStock: newStatus });
      fetchMenu();
    } catch(e) { alert('Failed to update stock status.'); }
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await axios.delete(`http://localhost:5000/api/menu/${id}`); fetchMenu(); } catch(e) { alert('Failed to delete.'); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status });
      if (status === 'Delivered') await axios.delete(`http://localhost:5000/api/orders/${orderId}`);
      fetchOrders();
    } catch(e) { alert('Failed to update order.'); }
  };

  const pending = orders.filter(o => o.status === 'Pending').length;
  const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0);
  const oosCount = menu.filter(m => m.inStock === false).length;

  return (
    <>
      <style>{styles}</style>
      {editingItem && <EditModal item={editingItem} onSave={updateMenuItem} onClose={() => setEditingItem(null)} />}

      {/* ── HEADER ── */}
      <header className="adm-hdr">
        <div className="adm-hdr-in">
          <div className="logo-wrap">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 52 52" fill="none">
                <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.3)"/>
                <circle cx="26" cy="34" r="2" fill="rgba(255,107,0,0.5)"/>
                <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div>
              <div className="logo-brand">Annapurna <span className="admin-badge">Admin</span></div>
              <div className="logo-sub">Dashboard</div>
            </div>
          </div>
          <button
              type="button"
              className="back-btn"
              onClick={() => navigate('/menu')}
              style={{ cursor:'pointer', pointerEvents:'all', position:'relative', zIndex:200 }}
            >
              ← Back to Menu
          </button>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="stats-bar">
        <div className="stats-in">
          <div className="stat-card"><div className="stat-lbl">Menu Items</div><div className="stat-val">{menu.length}</div><div className="stat-sub">Total dishes</div></div>
          <div className="stat-card"><div className="stat-lbl">Out of Stock</div><div className="stat-val" style={{ color: oosCount > 0 ? '#fca5a5' : 'white' }}>{oosCount}</div><div className="stat-sub">Disabled for users</div></div>
          <div className="stat-card"><div className="stat-lbl">Live Orders</div><div className="stat-val">{orders.length}</div><div className="stat-sub">{pending} pending</div></div>
          <div className="stat-card"><div className="stat-lbl">Revenue (Live)</div><div className="stat-val">₹{totalRev.toFixed(0)}</div><div className="stat-sub">Active orders</div></div>
          <div className="stat-card"><div className="stat-lbl">Ready to Deliver</div><div className="stat-val">{orders.filter(o => o.status === 'Ready').length}</div><div className="stat-sub">Awaiting pickup</div></div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div style={{ background:'#faf9f6' }}>
        <div className="tabs-wrap">
          <button className={`tab-btn${activeTab === 'menu' ? ' active' : ''}`} onClick={() => setActiveTab('menu')}>
            🍽️ Menu Management <span className={`tab-bdg bdg-gray`}>{menu.length}</span>
          </button>
          <button className={`tab-btn${activeTab === 'orders' ? ' active' : ''}`} onClick={() => setActiveTab('orders')}>
            📦 Live Orders
            <span className={`tab-bdg ${pending > 0 ? 'bdg-amber' : 'bdg-gray'}`}>{pending > 0 ? pending : orders.length}</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="adm-main">

        {/* ── MENU TAB ── */}
        {activeTab === 'menu' && (
          <div className="menu-layout">

            {/* Add form */}
            <div>
              <div className="panel">
                <div className="panel-hdr">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#FF7A33" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  <div className="panel-title">Add New Dish</div>
                </div>
                <div className="panel-body">
                  <UploadZone id="add-upload" imageUrl={newItem.imageUrl}
                    onUpload={async f => { setUploading(true); try { const url = await uploadImage(f); setNewItem(p => ({ ...p, imageUrl: url })); } catch(e) { alert('❌ ' + e.message); } finally { setUploading(false); } }}
                    onClear={() => setNewItem(p => ({ ...p, imageUrl: '' }))} />
                  <div className="fstack">
                    <input className="adm-inp" placeholder="Dish name e.g. Paneer Tikka" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                    <input className="adm-inp" placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
                    <div className="frow">
                      <div>
                        <input className="adm-inp" type="number" placeholder="Price (₹)" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} />
                      </div>
                      <div>
                        <input className="adm-inp" type="number" placeholder="Prep time (mins)" min="1" max="120" value={newItem.prepTime} onChange={e => setNewItem(p => ({ ...p, prepTime: e.target.value }))} />
                        <div className="inp-hint">⏱ Used to show ETA to customers</div>
                      </div>
                    </div>
                    <select className="adm-sel" value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                      <option value="">Select Category</option>
                      {['Breakfast','Lunch','Snacks','Beverages','Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary" onClick={addMenuItem} disabled={uploading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    {uploading ? 'Uploading…' : 'Add to Menu'}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu list */}
            <div className="list-panel">
              <div className="list-hdr">
                <div className="list-title">All Menu Items</div>
                <span className="list-count">{menu.length} dishes · {oosCount} out of stock</span>
              </div>
              <div className="menu-scroll">
                {menu.length === 0 ? (
                  <div className="empty-st"><div className="empty-icon">🍽️</div><div className="empty-title">No dishes yet</div></div>
                ) : menu.map(item => (
                  <div key={item.id} className="item-row">
                    <img className="item-thumb"
                      src={item.imageUrl || `https://via.placeholder.com/54/2d1f0e/FF7A33?text=${encodeURIComponent(item.name[0])}`}
                      alt={item.name}
                      style={{ opacity: item.inStock === false ? 0.5 : 1 }}
                    />
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">
                        <span>{item.category || 'Uncategorised'}</span>
                        {item.prepTime && <span>⏱ {item.prepTime}m</span>}
                      </div>
                    </div>
                    <div className="item-price">₹{item.price.toFixed(2)}</div>
                    <div className="item-acts">
                      {/* ── STOCK TOGGLE ── */}
                      <button
                        className={`oos-toggle ${item.inStock === false ? 'out-stock' : 'in-stock'}`}
                        onClick={() => toggleStock(item)}
                        title={item.inStock === false ? 'Mark as In Stock' : 'Mark as Out of Stock'}
                      >
                        {item.inStock === false ? '❌ OOS' : '✅ In Stock'}
                      </button>
                      <button className="icon-btn btn-edit" onClick={() => setEditingItem(item)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button className="icon-btn btn-del" onClick={() => deleteMenuItem(item.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:700, color:'#2d1f0e' }}>Live Orders</div>
                <div style={{ fontSize:'.82rem', color:'#9ca3af', marginTop:2 }}>{orders.length} active order{orders.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={fetchOrders} style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.55rem 1rem', background:'white', border:'1.5px solid #e5e7eb', borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', fontWeight:600, color:'#374151', cursor:'pointer' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                Refresh
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="empty-st"><div className="empty-icon">📭</div><div className="empty-title">No active orders</div><p style={{ fontSize:'.82rem' }}>New orders will appear here</p></div>
            ) : (
              ['Pending','Preparing','Ready'].map(status => {
                const group = orders.filter(o => o.status === status);
                if (!group.length) return null;
                return (
                  <div key={status} style={{ marginBottom:'2rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'1rem', paddingBottom:'.5rem', borderBottom:'1px solid #ede8e0' }}>
                      <span className={`status-pill s-${status}`}>{status}</span>
                      <span style={{ fontSize:'.8rem', color:'#9ca3af', fontWeight:500 }}>{group.length} order{group.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="orders-grid">
                      {group.map(order => (
                        <div key={order.id} className="ocard">
                          <div className="ocard-top">
                            <div>
                              <div className="ocard-id">Order #{order.id.slice(-6).toUpperCase()}</div>
                              {/* ETA badge */}
                              {order.eta && (
                                <div className="order-eta">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                  ETA {order.eta}
                                </div>
                              )}
                            </div>
                            <span className={`status-pill s-${order.status}`}>{order.status}</span>
                          </div>
                          <div className="ocard-body">
                            <div className="odet-row"><span className="odet-icon">👤</span><span className="odet-txt"><strong>Recipient:</strong> {order.deliveryName || '—'}</span></div>
                            <div className="odet-row"><span className="odet-icon">📍</span><span className="odet-txt"><strong>Location:</strong> {order.deliveryLocation || '—'}</span></div>
                            {order.items?.length > 0 && (
                              <div className="oitems">
                                {order.items.map((it, i) => (
                                  <div key={i} className="oitem-line">
                                    <span>{it.name} × {it.quantity}</span>
                                    <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="ototal">₹{order.total.toFixed(2)}</div>
                          </div>
                          <div className="status-btns">
                            {STATUS_ORDER.filter(s => s !== 'Delivered').map(s => (
                              <button key={s} className={`sbtn sb-${s}`} disabled={order.status === s} onClick={() => updateOrderStatus(order.id, s)}>{s}</button>
                            ))}
                            <button className="sbtn sb-Delivered" disabled={order.status === 'Delivered'} onClick={() => updateOrderStatus(order.id, 'Delivered')}>✓ Done</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </>
  );
}