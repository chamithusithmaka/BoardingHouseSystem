import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Base API URL
const API_URL = 'http://localhost:5000/api';

const ExpenseTrackingComponent = ({ userId }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch monthly expenses
  useEffect(() => {
    console.log('Fetching expenses for userId:', userId);
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/orders/expenses/${userId}`);
        setExpenses(response.data.data.expenses || []);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expense data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchExpenses();
    }
  }, [userId]);

  // Prepare data for the bar chart
  const chartData = {
    labels: expenses.map((expense) => expense.mealType),
    datasets: [
      {
        label: 'Total Spent ($)',
        data: expenses.map((expense) => expense.totalSpentCents / 100), // Convert cents to dollars
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'], // Colors for bars
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`, // Format y-axis labels as dollars
        },
      },
    },
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Monthly Expense Tracking</h2>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <FaSpinner className="text-amber-500 text-3xl animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-white mb-2">No Expenses Found</h3>
          <p className="text-gray-400">You haven't spent anything on meals this month.</p>
        </div>
      ) : (
        <div className="h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default ExpenseTrackingComponent;