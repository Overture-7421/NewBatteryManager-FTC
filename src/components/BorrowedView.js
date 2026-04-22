import { useState, useEffect } from 'react';
import { Package, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BorrowedView = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    teamName: '',
    teamNumber: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const stored = localStorage.getItem('ftc_borrowed_items');
    if (stored) {
      setItems(JSON.parse(stored));
    }
  };

  const saveItems = (data) => {
    localStorage.setItem('ftc_borrowed_items', JSON.stringify(data));
    setItems(data);
  };

  const addItem = (e) => {
    e.preventDefault();
    
    if (!formData.item || !formData.teamName || !formData.teamNumber) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      ...formData,
      status: 'prestado',
      date: new Date().toISOString(),
    };

    saveItems([...items, newItem]);
    setFormData({ item: '', teamName: '', teamNumber: '' });
    setShowModal(false);
    toast.success('Item registrado');
  };

  const toggleStatus = (id) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newStatus = item.status === 'prestado' ? 'devuelto' : 'prestado';
        toast.success(`${item.item} marcado como ${newStatus}`);
        return { ...item, status: newStatus };
      }
      return item;
    });
    saveItems(updated);
  };

  const deleteItem = (id) => {
    const filtered = items.filter(item => item.id !== id);
    saveItems(filtered);
    toast.success('Item eliminado');
  };

  const borrowedItems = items.filter(i => i.status === 'prestado');
  const returnedItems = items.filter(i => i.status === 'devuelto');

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-[#7C3AED]" />
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Cosas Prestadas
            </h1>
          </div>
          <p className="text-[#9CA3AF]">Registra equipo prestado a otros equipos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          data-testid="add-borrowed-item-btn"
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-3 rounded-xl btn-scale glow-purple font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Prestar Item</span>
        </button>
      </div>

      <div className="space-y-6">
        {borrowedItems.length > 0 && (
          <div className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Prestados</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#272732]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Equipo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Fecha</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowedItems.map(item => (
                    <tr key={item.id} className="border-b border-[#272732] hover:bg-[#252530]" data-testid={`borrowed-item-${item.id}`}>
                      <td className="py-3 px-4 text-white font-medium">{item.item}</td>
                      <td className="py-3 px-4 text-[#E5E7EB]">{item.teamName}</td>
                      <td className="py-3 px-4 text-[#A78BFA] font-semibold">{item.teamNumber}</td>
                      <td className="py-3 px-4 text-[#9CA3AF] text-sm">
                        {new Date(item.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleStatus(item.id)}
                          data-testid={`return-btn-${item.id}`}
                          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 py-1 rounded-lg text-sm mr-2"
                        >
                          Devuelto
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          data-testid={`delete-btn-${item.id}`}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {returnedItems.length > 0 && (
          <div className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Devueltos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#272732]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Equipo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Fecha</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#9CA3AF] uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedItems.map(item => (
                    <tr key={item.id} className="border-b border-[#272732] hover:bg-[#252530] opacity-60" data-testid={`returned-item-${item.id}`}>
                      <td className="py-3 px-4 text-white font-medium">{item.item}</td>
                      <td className="py-3 px-4 text-[#E5E7EB]">{item.teamName}</td>
                      <td className="py-3 px-4 text-[#A78BFA] font-semibold">{item.teamNumber}</td>
                      <td className="py-3 px-4 text-[#9CA3AF] text-sm">
                        {new Date(item.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-[#7C3AED] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#9CA3AF] mb-2">No hay items registrados</h2>
            <p className="text-[#6B7280]">Comienza registrando el primer item prestado</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div 
            className="bg-[#1A1A22] border border-[#272732] rounded-2xl p-6 w-full max-w-md shadow-2xl relative fade-in"
            onClick={(e) => e.stopPropagation()}
            data-testid="borrowed-item-modal"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Prestar Item
            </h2>

            <form onSubmit={addItem}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Item
                  </label>
                  <input
                    type="text"
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    placeholder="Batería, Cargador, Herramienta..."
                    data-testid="item-input"
                    className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Nombre del Equipo
                  </label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="RoboTech"
                    data-testid="team-name-input"
                    className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Número de Equipo
                  </label>
                  <input
                    type="text"
                    value={formData.teamNumber}
                    onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value })}
                    placeholder="12345"
                    data-testid="team-number-input"
                    className="w-full bg-[#0F0F14] border border-[#272732] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-[#272732] text-[#9CA3AF] hover:bg-[#252530] px-4 py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="save-borrowed-item-btn"
                  className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-3 rounded-xl btn-scale glow-purple font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowedView;
