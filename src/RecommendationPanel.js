import React from 'react';
import './RecommendationPanel.css';

const RecommendationPanel = ({ recommendations, loading, error, subscriptions }) => {
  // Support single solution only
  const current = Array.isArray(recommendations) ? recommendations[0] : recommendations;

  if (loading) return <div className="recommendation-panel">Loading recommendations...</div>;
  if (error) return <div className="recommendation-panel error">{error}</div>;
  if (!current) return null;

  // Map IDs to names
  const idToName = {};
  if (subscriptions && Array.isArray(subscriptions)) {
    subscriptions.forEach(sub => {
      idToName[sub.id] = sub.name || sub.merchant_name || sub.id;
    });
  }

  return (
    <div className="recommendation-panel">
      <h3>Recommendations</h3>
      <div>
        <strong>Keep:</strong> {current.keep && current.keep.length > 0
          ? current.keep.map((id, idx) => (
              <span key={id} className="recommendation-name" style={{ color: '#2980b9', fontWeight: 600 }}>
                {idToName[id] || id}{idx < current.keep.length - 1 ? ', ' : ''}
              </span>
            ))
          : 'None'}
      </div>
      <div>
        <strong>Cancel:</strong> {current.cancel && current.cancel.length > 0
          ? current.cancel.map((id, idx) => (
              <span key={id} className="recommendation-name" style={{ color: '#2980b9', fontWeight: 600 }}>
                {idToName[id] || id}{idx < current.cancel.length - 1 ? ', ' : ''}
              </span>
            ))
          : 'None'}
      </div>
      <div>
        <strong>Total Subscriptions:</strong> <span className="recommendation-name">${current.total_subscriptions}</span>
      </div>
      <div>
        <strong>Other Transactions:</strong> <span className="recommendation-name">${current.other_transactions}</span>
      </div>
      <div>
        <strong>All Spending:</strong> <span className="recommendation-name">${current.all_spending}</span>
      </div>
    </div>
  );
};

export default RecommendationPanel;
