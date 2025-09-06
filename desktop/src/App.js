import React, { useState, useEffect } from 'react';
import './App.css';

// API Configuration
const API_BASE = 'http://localhost:8000';

// Utility Functions
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  login: (email, password) =>
    api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getItems: (category, search) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return api.request(`/items?${params.toString()}`);
  },

  getItem: (id) => api.request(`/items/${id}`),
  
  createItem: (itemData) =>
    api.request('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
  
  purchaseItem: (id) =>
    api.request(`/items/${id}/purchase`, { method: 'POST' }),

  getMessages: (itemId) => api.request(`/messages/${itemId}`),
  
  sendMessage: (messageData) =>
    api.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),

  getUserInfo: () => api.request('/users/me'),
  getTransactions: () => api.request('/transactions'),
};

// Components
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
);

const CartPage = ({ cart, onRemove, onCheckout }) => (
  <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
    {cart.length === 0 ? (
      <p className="text-gray-500">Your cart is empty.</p>
    ) : (
      <>
        <ul className="divide-y">
          {cart.map((item) => (
            <li key={item.id} className="flex justify-between items-center py-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-500">₹{item.price}</p>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-6">
          <span className="font-bold text-lg">
            Total: ₹{cart.reduce((sum, item) => sum + Number(item.price), 0)}
          </span>
          <button
            onClick={onCheckout}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Confirm Order
          </button>
        </div>
      </>
    )}
  </div>
);

const OrderConfirmation = ({ order, onBackToMarket }) => (
  <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
    <h2 className="text-2xl font-bold mb-4 text-green-700">Order Confirmed!</h2>
    <p className="mb-6 text-gray-700">
      Thank you for your purchase. Your order has been placed successfully.
    </p>
    <ul className="mb-6">
      {order.items.map((item) => (
        <li key={item.id} className="mb-2">
          <span className="font-semibold">{item.title}</span> — ₹{item.price}
        </li>
      ))}
    </ul>
    <div className="font-bold mb-6">
      Total Paid: ₹{order.total}
    </div>
    <button
      onClick={onBackToMarket}
      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
    >
      Back to Marketplace
    </button>
  </div>
);

const AuthForm = ({ isLogin, onSubmit, onToggle }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {isLogin ? 'Welcome Back' : 'Join EcoFINDS'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={onToggle}
            className="ml-2 text-green-600 hover:text-green-700 font-semibold"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

const Header = ({ user, onLogout, currentView, setCurrentView, cart }) => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-green-600">🌱 EcoFINDS</h1>
          <nav className="flex space-x-6">
            <button
              onClick={() => setCurrentView('marketplace')}
              className={`px-3 py-2 rounded-md ${
                currentView === 'marketplace'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setCurrentView('sell')}
              className={`px-3 py-2 rounded-md ${
                currentView === 'sell'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Sell Item
            </button>
            <button
              onClick={() => setCurrentView('messages')}
              className={`px-3 py-2 rounded-md ${
                currentView === 'messages'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`px-3 py-2 rounded-md ${
                currentView === 'profile'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setCurrentView('cart')}
              className={`px-3 py-2 rounded-md ${
                currentView === 'cart'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Cart {cart.length > 0 && <span className="ml-1">({cart.length})</span>}
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
            <span className="text-green-600 font-semibold">🌿 {user.eco_points}</span>
          </div>
          <span className="text-gray-700">Welcome, {user.username}!</span>
          <button
            onClick={onLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
);

const ItemCard = ({ item, onView, onMessage, addToCart }) => (
  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
      {item.images && item.images.length > 0 ? (
        <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover rounded-t-lg" />
      ) : (
        <span className="text-gray-400 text-4xl">📦</span>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
      <div className="flex justify-between items-center mb-3">
        <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
        <span className="text-sm text-green-500">+{item.eco_points_reward} 🌿</span>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
        <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
        <span>{item.condition}</span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onView(item)}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          View Details
        </button>
        <button
          onClick={() => onMessage(item)}
          className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
        >
          💬
        </button>
        <button
          onClick={() => addToCart(item)}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Add to Cart
        </button>
      </div>
    </div>
  </div>
);

const ItemModal = ({ item, onClose, onPurchase, user, addToCart }) => {
  const [isMessaging, setIsMessaging] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isMessaging && item) {
      loadMessages();
    }
  }, [isMessaging, item]);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(item.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await api.sendMessage({
        item_id: item.id,
        receiver_id: item.seller_id,
        content: newMessage,
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await onPurchase(item.id);
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{item.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover rounded-lg" />
              ) : (
                <span className="text-gray-400 text-6xl">📦</span>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold text-green-600">₹{item.price}</span>
                <span className="text-lg text-green-500">+{item.eco_points_reward} 🌿</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span className="bg-gray-100 px-3 py-1 rounded">{item.category}</span>
                <span className="bg-blue-100 px-3 py-1 rounded">{item.condition}</span>
              </div>
              
              <p className="text-gray-700">{item.description}</p>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Sold by: <span className="font-semibold">{item.seller_name || 'Unknown'}</span>
                </p>
                
                {item.seller_id !== user.id && item.is_available && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePurchase}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Buy Now'}
                    </button>
                    <button
                      onClick={() => setIsMessaging(!isMessaging)}
                      className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                    >
                      {isMessaging ? 'Hide Chat' : 'Chat with Seller'}
                    </button>
                    <button
                      onClick={() => addToCart(item)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                )}
                
                {!item.is_available && (
                  <p className="text-red-600 font-semibold">This item has been sold</p>
                )}
              </div>
            </div>
          </div>
          
          {isMessaging && (
            <div className="border-l pl-6">
              <h3 className="font-semibold mb-4">Chat with Seller</h3>
              <div className="h-64 border rounded-lg p-3 overflow-y-auto mb-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 ${msg.sender_id === user.id ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block p-2 rounded-lg max-w-xs ${
                        msg.sender_id === user.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SellItemForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Electronics',
    condition: 'Good',
    images: [],
  });

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other'];
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, price: parseFloat(formData.price) });
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'Electronics',
      condition: 'Good',
      images: [],
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">List Your Item</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 h-24"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Image URLs (optional)</label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            onChange={(e) => {
              if (e.target.value) {
                setFormData({ ...formData, images: [e.target.value] });
              }
            }}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
        >
          List Item
        </button>
      </form>
    </div>
  );
};

const Marketplace = ({ onItemClick, onMessageClick, addToCart }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other'];

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line
  }, [selectedCategory, searchTerm]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.getItems(
        selectedCategory === 'All' ? '' : selectedCategory,
        searchTerm
      );
      setItems(data.filter(item => item.is_available));
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2"
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onView={onItemClick}
              onMessage={onMessageClick}
              addToCart={addToCart}
            />
          ))}
        </div>
      )}
      
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items found</p>
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ user, transactions }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.full_name}</h2>
            <p className="text-gray-600">@{user.username}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <div className="ml-auto text-center">
            <div className="bg-green-50 px-6 py-4 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{user.eco_points}</p>
              <p className="text-sm text-green-600">Eco Points</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Transaction History</h3>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{transaction.item_title}</h4>
                    <p className="text-sm text-gray-600">
                      {transaction.type === 'purchase' ? 'Purchased from' : 'Sold to'} {transaction.other_user}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{transaction.amount}</p>
                    {transaction.type === 'purchase' && (
                      <p className="text-sm text-green-600">+{transaction.eco_points_earned} 🌿</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No transactions yet</p>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [currentView, setCurrentView] = useState('marketplace');
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  const addToCart = (item) => {
    if (!cart.find((i) => i.id === item.id)) {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = () => {
    setOrderConfirmed({
      items: cart,
      total: cart.reduce((sum, item) => sum + Number(item.price), 0),
    });
    clearCart();
    setCurrentView('orderConfirmation');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserInfo();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
    // eslint-disable-next-line
  }, [user]);

  const loadUserInfo = async () => {
    try {
      const userData = await api.getUserInfo();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user info:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleAuth = async (formData) => {
    try {
      const response = isLogin
        ? await api.login(formData.email, formData.password)
        : await api.register(formData);
      
      localStorage.setItem('token', response.access_token);
      await loadUserInfo();
    } catch (error) {
      console.error('Auth error:', error);
      alert(isLogin ? 'Login failed' : 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('marketplace');
  };

  const handlePurchase = async (itemId) => {
    try {
      const result = await api.purchaseItem(itemId);
      alert(`Purchase successful! You earned ${result.eco_points_earned} eco points!`);
      await loadUserInfo();
      await loadTransactions();
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed');
    }
  };

  const handleSellItem = async (itemData) => {
    try {
      await api.createItem(itemData);
      alert('Item listed successfully!');
      setCurrentView('marketplace');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to list item');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <AuthForm
        isLogin={isLogin}
        onSubmit={handleAuth}
        onToggle={() => setIsLogin(!isLogin)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
        cart={cart}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'marketplace' && (
          <Marketplace
            onItemClick={setSelectedItem}
            onMessageClick={setSelectedItem}
            addToCart={addToCart}
          />
        )}
        
        {currentView === 'sell' && (
          <SellItemForm onSubmit={handleSellItem} />
        )}
        
        {currentView === 'profile' && (
          <ProfileView user={user} transactions={transactions} />
        )}
        
        {currentView === 'messages' && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Messages feature coming soon! Use the chat button on item cards to message sellers.
            </p>
          </div>
        )}

        {currentView === 'cart' && (
          <CartPage
            cart={cart}
            onRemove={removeFromCart}
            onCheckout={handleCheckout}
          />
        )}

        {currentView === 'orderConfirmation' && orderConfirmed && (
          <OrderConfirmation
            order={orderConfirmed}
            onBackToMarket={() => setCurrentView('marketplace')}
          />
        )}
      </main>
      
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          user={user}
          onClose={() => setSelectedItem(null)}
          onPurchase={handlePurchase}
          addToCart={addToCart}
        />
      )}
    </div>
  );
};

export default App;