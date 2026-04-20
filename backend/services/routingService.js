/**
 * Service to determine where a call should be routed based on the time.
 * Standard Office Hours: 8:00 AM to 8:00 PM
 */

const getRoutingDestination = () => {
  const now = new Date();
  
  // Use a specific timezone if configured, otherwise use server time
  const timezone = process.env.OFFICE_TIMEZONE || 'Asia/Kolkata';
  
  const options = {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const hour = parseInt(formatter.format(now));

  console.log(`Current Hour in ${timezone}: ${hour}`);

  // 8:00 AM (8) to 8:00 PM (20)
  if (hour >= 8 && hour < 20) {
    return 'Employee';
  } else {
    return 'AI';
  }
};

module.exports = {
  getRoutingDestination
};
