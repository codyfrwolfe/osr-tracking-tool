import React, { useState, useEffect } from 'react';
import { Clock, Globe, MapPin } from 'lucide-react';

const MovingClocksFooter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Time zones for different regions
  const timeZones = [
    {
      name: 'New York',
      timezone: 'America/New_York',
      icon: <MapPin className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'London',
      timezone: 'Europe/London',
      icon: <Globe className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Tokyo',
      timezone: 'Asia/Tokyo',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Sydney',
      timezone: 'Australia/Sydney',
      icon: <Globe className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      name: 'Los Angeles',
      timezone: 'America/Los_Angeles',
      icon: <MapPin className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time for specific timezone
  const formatTimeForTimezone = (timezone) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(currentTime);
  };

  // Get date for specific timezone
  const getDateForTimezone = (timezone) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(currentTime);
  };

  // Calculate rotation angle for clock hands
  const getClockRotation = (timezone) => {
    const time = new Date().toLocaleString("en-US", { timeZone: timezone });
    const date = new Date(time);
    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return {
      hour: (hours * 30) + (minutes * 0.5), // 30 degrees per hour + minute adjustment
      minute: minutes * 6, // 6 degrees per minute
      second: seconds * 6  // 6 degrees per second
    };
  };

  return (
    <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 w-32 h-32 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-purple-500 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-500 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Global Time Zones</h3>
          <p className="text-gray-600">Real-time collaboration across the world</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {timeZones.map((zone, index) => {
            const rotation = getClockRotation(zone.timezone);
            
            return (
              <div
                key={zone.name}
                className={`${zone.bgColor} rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {/* Analog Clock */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-gray-300 rounded-full bg-white shadow-inner">
                    {/* Clock face dots */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-gray-400 rounded-full"
                        style={{
                          top: '2px',
                          left: '50%',
                          transformOrigin: '50% 38px',
                          transform: `translateX(-50%) rotate(${i * 30}deg)`
                        }}
                      />
                    ))}
                    
                    {/* Hour hand */}
                    <div
                      className="absolute bg-gray-800 rounded-full origin-bottom"
                      style={{
                        width: '3px',
                        height: '24px',
                        top: '16px',
                        left: '50%',
                        transformOrigin: '50% 100%',
                        transform: `translateX(-50%) rotate(${rotation.hour}deg)`,
                        transition: 'transform 0.5s ease-in-out'
                      }}
                    />
                    
                    {/* Minute hand */}
                    <div
                      className="absolute bg-gray-600 rounded-full origin-bottom"
                      style={{
                        width: '2px',
                        height: '32px',
                        top: '8px',
                        left: '50%',
                        transformOrigin: '50% 100%',
                        transform: `translateX(-50%) rotate(${rotation.minute}deg)`,
                        transition: 'transform 0.5s ease-in-out'
                      }}
                    />
                    
                    {/* Second hand */}
                    <div
                      className="absolute bg-red-500 rounded-full origin-bottom"
                      style={{
                        width: '1px',
                        height: '36px',
                        top: '4px',
                        left: '50%',
                        transformOrigin: '50% 100%',
                        transform: `translateX(-50%) rotate(${rotation.second}deg)`,
                        transition: 'transform 0.1s ease-out'
                      }}
                    />
                    
                    {/* Center dot */}
                    <div className="absolute w-2 h-2 bg-gray-800 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Location info */}
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className={zone.color}>{zone.icon}</span>
                  <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                </div>

                {/* Digital time */}
                <div className="space-y-1">
                  <div className={`text-lg font-mono font-bold ${zone.color}`}>
                    {formatTimeForTimezone(zone.timezone)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getDateForTimezone(zone.timezone)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer message */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold">OSR Assessment Tool</span> - Enabling global collaboration in real-time
          </p>
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-500">
            <span>🌍 Multi-timezone support</span>
            <span>⚡ Real-time sync</span>
            <span>🤝 Team collaboration</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MovingClocksFooter;

