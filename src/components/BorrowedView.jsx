import { useEffect, useState } from 'react';

const BorrowedView = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    itemName: '',
    teamName: '',
    teamNumber: '',
    status: 'borrowed',
  });

  useEffect(() => {
    const saved = localStorage.getItem('borrowedItems');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('borrowedItems', JSON.stringify(items));
  }, [items]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newItem = {
      id: Date.now(),
      ...formData,
    };

    setItems((prev) => [newItem, ...prev]);
    setFormData({
      itemName: '',
      teamName: '',
      teamNumber: '',
      status: 'borrowed',
    });
  };

  const handleStatusChange = (itemId, status) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Borrowed Items</h1>

      <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Log Borrowed Item</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Item"
            value={formData.itemName}
            onChange={(event) => setFormData({ ...formData, itemName: event.target.value })}
            className="bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            required
          />
          <input
            type="text"
            placeholder="Team Name"
            value={formData.teamName}
            onChange={(event) => setFormData({ ...formData, teamName: event.target.value })}
            className="bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            required
          />
          <input
            type="text"
            placeholder="Team Number"
            value={formData.teamNumber}
            onChange={(event) => setFormData({ ...formData, teamNumber: event.target.value })}
            className="bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
            required
          />
          <select
            value={formData.status}
            onChange={(event) => setFormData({ ...formData, status: event.target.value })}
            className="bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="borrowed">Borrowed</option>
            <option value="returned">Returned</option>
          </select>
          <button
            type="submit"
            className="btn-primary md:col-span-2 text-white py-2 rounded-lg transition"
          >
            Save
          </button>
        </form>
      </div>

      <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Borrowed Items</h2>
        {items.length === 0 ? (
          <p className="text-[#9CA3AF]">No records yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-[#272732] rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-[#9CA3AF]">
                    {item.teamName} · #{item.teamNumber}
                  </p>
                </div>
                <select
                  value={item.status}
                  onChange={(event) => handleStatusChange(item.id, event.target.value)}
                  className="bg-[#252530] border border-[#3A3A42] rounded px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="borrowed">Borrowed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowedView;
