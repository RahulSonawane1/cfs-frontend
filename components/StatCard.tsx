
import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => {
    return (
        <div className="card" style={{ textAlign: 'center', minWidth: 180 }}>
            <div>
            <h3 style={{ marginBottom: '0.5em' }}>{title}</h3>
            <p style={{ fontSize: '2em', fontWeight: 700 }}>{value}</p>
            </div>
            {description && <p className="text-xs text-gray-400 mt-4">{description}</p>}
        </div>
    );
};

export default StatCard;
