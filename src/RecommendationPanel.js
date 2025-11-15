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
          ? current.keep.map(id => idToName[id] || id).join(', ')
          : 'None'}
      </div>
      <div>
        <strong>Cancel:</strong> {current.cancel && current.cancel.length > 0
          ? current.cancel.map(id => idToName[id] || id).join(', ')
          : 'None'}
      </div>
      <div>
        <strong>Total Subscriptions:</strong> ${current.total_subscriptions}
      </div>
      <div>
        <strong>Other Transactions:</strong> ${current.other_transactions}
      </div>
      <div>
        <strong>All Spending:</strong> ${current.all_spending}
      </div>
    </div>
  );
};

export default RecommendationPanel;
