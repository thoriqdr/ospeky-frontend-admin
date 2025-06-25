import React from 'react';

// Komponen ini sekarang lebih fleksibel
const KpiCard = ({ title, value, percentage, isUp, icon }) => {
  const percentageClass = isUp ? 'positive' : 'negative';

  return (
    <div className="kpi-card">
      <div className="kpi-icon-wrapper">
        {icon}
      </div>
      <div className="kpi-details">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
        {/* Bagian footer ini hanya akan muncul jika ada data 'percentage' */}
        {percentage && (
          <div className="kpi-footer">
            <span className={`kpi-percentage ${percentageClass}`}>
              {percentage}
            </span>
            <span className="kpi-period">
              {isUp ? 'Up from yesterday' : 'Down from yesterday'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;