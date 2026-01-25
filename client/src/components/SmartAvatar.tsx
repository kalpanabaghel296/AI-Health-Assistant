import { User } from "@shared/schema";

interface SmartAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function SmartAvatar({ user, size = "md", className = "" }: SmartAvatarProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };

  const getBmiCategory = (bmi: number | null | undefined) => {
    if (!bmi) return "normal";
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    return "obese";
  };

  const getAgeGroup = (age: number | null | undefined) => {
    if (!age) return "adult";
    if (age < 18) return "child";
    if (age < 60) return "adult";
    return "senior";
  };

  const bmiCategory = getBmiCategory(user.bmi);
  const ageGroup = getAgeGroup(user.age);
  const gender = user.gender || "male";

  const getAvatarColors = () => {
    const baseColors = {
      male: { skin: "#DEB887", hair: "#4A3728", shirt: "#4A90A4" },
      female: { skin: "#F5D0C5", hair: "#5C4033", shirt: "#E88B9A" },
    };
    return baseColors[gender as keyof typeof baseColors] || baseColors.male;
  };

  const colors = getAvatarColors();

  const getBodyScale = () => {
    switch (bmiCategory) {
      case "underweight": return { body: 0.85, face: 0.95 };
      case "normal": return { body: 1, face: 1 };
      case "overweight": return { body: 1.15, face: 1.1 };
      case "obese": return { body: 1.3, face: 1.2 };
      default: return { body: 1, face: 1 };
    }
  };

  const scale = getBodyScale();

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <clipPath id="avatarClip">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        
        <g clipPath="url(#avatarClip)">
          <rect x="0" y="0" width="100" height="100" fill="hsl(var(--primary) / 0.15)" />
          
          <ellipse 
            cx="50" 
            cy="95" 
            rx={22 * scale.body} 
            ry={18 * scale.body} 
            fill={colors.shirt}
          />
          
          <ellipse 
            cx="50" 
            cy="75" 
            rx={8 * scale.body} 
            ry={6} 
            fill={colors.skin}
          />
          
          <ellipse 
            cx="50" 
            cy="45" 
            rx={18 * scale.face} 
            ry={22 * scale.face} 
            fill={colors.skin}
          />
          
          {gender === "male" ? (
            <path 
              d={`M ${32 * scale.face + (50 - 18 * scale.face)} 35 
                  Q 50 ${15 - (ageGroup === "child" ? 5 : 0)} 
                  ${50 + 18 * scale.face - 32 * scale.face + 50} 35
                  L ${50 + 15 * scale.face} 28
                  Q 50 22 ${50 - 15 * scale.face} 28 Z`}
              fill={colors.hair}
            />
          ) : (
            <>
              <ellipse cx="50" cy="30" rx={20 * scale.face} ry={15} fill={colors.hair} />
              <ellipse cx="30" cy="45" rx={5} ry={15} fill={colors.hair} />
              <ellipse cx="70" cy="45" rx={5} ry={15} fill={colors.hair} />
            </>
          )}
          
          <circle cx={50 - 6 * scale.face} cy={42} r={2.5} fill="#333" />
          <circle cx={50 + 6 * scale.face} cy={42} r={2.5} fill="#333" />
          
          <ellipse 
            cx="50" 
            cy={52 * scale.face} 
            rx={4} 
            ry={2.5} 
            fill="#C4A484"
          />
          
          <path 
            d={`M ${50 - 5} ${58 * scale.face} Q 50 ${62 * scale.face} ${50 + 5} ${58 * scale.face}`}
            stroke="#333"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          
          {ageGroup === "child" && (
            <>
              <circle cx={50 - 12 * scale.face} cy={48} r={4} fill="#FFB6C1" opacity="0.5" />
              <circle cx={50 + 12 * scale.face} cy={48} r={4} fill="#FFB6C1" opacity="0.5" />
            </>
          )}
          
          {ageGroup === "senior" && (
            <>
              <line x1={50 - 10} y1={38} x2={50 - 6} y2={40} stroke="#666" strokeWidth="0.5" />
              <line x1={50 + 10} y1={38} x2={50 + 6} y2={40} stroke="#666" strokeWidth="0.5" />
            </>
          )}
        </g>
        
        <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      </svg>
    </div>
  );
}
