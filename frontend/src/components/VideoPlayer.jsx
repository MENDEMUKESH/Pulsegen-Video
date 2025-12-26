import { useState, useEffect } from 'react';

function VideoPlayer({ videoId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoId) {
      setError('No video selected');
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [videoId]);

  if (loading) return <div className="text-center p-4">Loading video...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div style={{ margin: '20px 0' }}>
      <video width="100%" height="auto" controls autoPlay>
        <source src={`http://localhost:5000/api/videos/${videoId}/stream`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoPlayer