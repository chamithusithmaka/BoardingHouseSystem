import { FaUser } from 'react-icons/fa';

const TenantAvatar = ({ name, photoUrl, size = "md" }) => {
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-xl"
  };
  
  return (
    <>
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={name || 'Tenant'} 
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-amber-500`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold`}>
          {name ? getInitials(name) : <FaUser />}
        </div>
      )}
    </>
  );
};

export default TenantAvatar;