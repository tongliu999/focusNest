
import React from 'react';
import { Module } from '../types';
import { Journey } from '../App'; // Import the Journey type from App

interface DashboardProps {
    journeys: Journey[];
    loading: boolean;
    onLoadJourney: (modules: Module[], currentIndex: number, title: string) => void;
    onStartNewJourney: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ journeys, loading, onLoadJourney, onStartNewJourney }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl">Loading journeys...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Public Journeys</h1>
                <button 
                    onClick={onStartNewJourney} 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    + Create New
                </button>
            </div>
            {journeys.length === 0 ? (
                <p>No public journeys available yet. Why not create the first one?</p>
            ) : (
                <ul className="space-y-4">
                    {journeys.map(journey => (
                        <li key={journey.id} 
                            className="p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => onLoadJourney(journey.modules, journey.currentModuleIndex, journey.title)}>
                            <h2 className="text-xl font-semibold">{journey.title}</h2>
                            <p className="text-gray-600">Progress: Module {journey.currentModuleIndex + 1} of {journey.modules.length}</p>
                            <p className="text-xs text-gray-400 mt-2">Created on: {journey.createdAt?.toDate ? new Date(journey.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Dashboard;
