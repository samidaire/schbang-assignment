'use client';

import { useState } from 'react';

interface Influencer {
  Name: string;
  Handle?: string;
  Platform: string;
  Category: string;
  Followers: number;
  'Engagement Rate (%)': number;
  'Avg Reel Views'?: number;
  'Past Brand Collabs'?: string;
  'Content Quality'?: string;
  'Rate (INR)'?: number;
  City?: string;
  score: number;
  reasons: string[];
  rejection_reasons?: string[];
  ai_review: string;
  influencer_type: string;
  tier: string;
}

interface AnalysisResults {
  shortlisted: Influencer[];
  rejected: Influencer[];
  total_shortlisted: number;
  total_rejected: number;
  budget_used: number;
  remaining_budget: number;
  tier23_percentage: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data: AnalysisResults = await response.json();

      setResults(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInfluencers =
    results?.shortlisted?.filter((influencer: Influencer) => {
      const platformMatch =
        platformFilter === 'All' || influencer.Platform === platformFilter;

      const typeMatch =
        typeFilter === 'All' || influencer.influencer_type === typeFilter;

      const tierMatch = tierFilter === 'All' || influencer.tier === tierFilter;

      return platformMatch && typeMatch && tierMatch;
    }) || [];

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-10">Influencer AI Platform</h1>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files) {
            setFile(e.target.files[0]);
          }
        }}
        className="mb-5"
      />

      <br />

      <button
        onClick={handleUpload}
        className="bg-green-500 text-black px-6 py-3 rounded font-bold"
      >
        {loading ? 'Analyzing...' : 'Analyze Influencers'}
      </button>

      {loading && <p className="mt-5 text-yellow-400">Analyzing...</p>}

      {error && (
        <div className="mt-5 border border-red-500 bg-red-500/10 text-red-400 p-4 rounded">
          <p className="font-bold">Analysis Failed</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-10">
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div className="border border-green-500 p-5 rounded">
              <h2 className="text-3xl font-bold">
                {results.total_shortlisted}
              </h2>

              <p className="text-gray-400 mt-2">Shortlisted</p>
            </div>

            <div className="border border-red-500 p-5 rounded">
              <h2 className="text-3xl font-bold">{results.total_rejected}</h2>

              <p className="text-gray-400 mt-2">Rejected</p>
            </div>

            <div className="border border-blue-500 p-5 rounded">
              <h2 className="text-3xl font-bold">
                ₹{results.budget_used?.toLocaleString()}
              </h2>

              <p className="text-gray-400 mt-2">Budget Used</p>
            </div>

            <div className="border border-yellow-500 p-5 rounded">
              <h2 className="text-3xl font-bold">
                ₹{results.remaining_budget?.toLocaleString()}
              </h2>

              <p className="text-gray-400 mt-2">Remaining Budget</p>
            </div>
          </div>

          {/* SHORTLISTED */}
          <h2 className="text-3xl font-bold mb-5">Shortlisted Influencers</h2>

          <div className="flex gap-4 mb-8 flex-wrap">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded"
            >
              <option>All</option>
              <option>Instagram</option>
              <option>YouTube</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded"
            >
              <option>All</option>
              <option>Micro</option>
              <option>Macro</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-black border border-gray-700 p-3 rounded"
            >
              <option>All</option>
              <option>Tier 1</option>
              <option>Tier 2/3</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInfluencers.map((influencer: Influencer, index: number) => (
              <div
                key={index}
                className="border border-green-500 p-5 rounded max-w-3xl"
              >
                <h3 className="text-2xl font-bold">{influencer.Name}</h3>

                <p>{influencer.Handle}</p>

                <p>Platform: {influencer.Platform}</p>
                <p>Category: {influencer.Category}</p>
                <p>Followers: {influencer.Followers}</p>
                <p>Type: {influencer.influencer_type}</p>

                <p>Tier: {influencer.tier}</p>

                <p>Engagement: {influencer['Engagement Rate (%)']}%</p>

                <p>Score: {influencer.score}</p>
                <div className="mt-5">
                  <h4 className="font-bold text-blue-400">AI Review:</h4>

                  <p className="text-gray-300 mt-2">{influencer.ai_review}</p>
                </div>

                <div className="mt-3">
                  <p className="font-bold">Reasons:</p>

                  <ul className="list-disc ml-5">
                    {influencer.reasons.map((reason: string, i: number) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* REJECTED */}
          <h2 className="text-3xl font-bold mt-10 mb-5 text-red-500">
            Rejected Influencers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.rejected.map((influencer: Influencer, index: number) => (
              <div key={index} className="border border-red-500 p-5 rounded">
                <h3 className="text-2xl font-bold">{influencer.Name}</h3>

                <p>Score: {influencer.score}</p>

                <div className="mt-3">
                  <p className="font-bold text-red-400">Rejection Reasons:</p>

                  <ul className="list-disc ml-5 mt-2 text-red-300">
                    {influencer.rejection_reasons?.map(
                      (reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ),
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-blue-400">AI Review:</h4>

                  <p className="text-gray-300 mt-2">{influencer.ai_review}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
