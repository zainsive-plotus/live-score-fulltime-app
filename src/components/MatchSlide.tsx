import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';

interface MatchSlideProps {
  match: any; // Use a more specific type if you have one
}

export default function MatchSlide({ match }: MatchSlideProps) {
  const { teams, fixture, league } = match;

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-2xl bg-brand-secondary text-white">
      {/* Background Image & Overlay */}
      <Image
        // Use a generic, high-quality background image
        src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop"
        alt="Stadium background"
        layout="fill"
        objectFit="cover"
        className="z-0"
      />
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center p-4">
        <p className="font-semibold tracking-wider text-brand-muted">Upcoming Match</p>
        <p className="text-sm text-brand-muted mb-4">{league.round}</p>
        
        <div className="flex items-center justify-around w-full max-w-lg my-2">
          {/* Home Team */}
          <div className="flex items-center gap-3">
            <Image src={teams.home.logo} alt={teams.home.name} width={40} height={40}/>
            <h2 className="text-3xl sm:text-4xl font-black">{teams.home.name}</h2>
          </div>
          
          <span className="text-xl font-light text-brand-muted mx-4">VS</span>
          
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-black">{teams.away.name}</h2>
            <Image src={teams.away.logo} alt={teams.away.name} width={40} height={40}/>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-x-6 gap-y-2 text-brand-muted">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{format(new Date(fixture.date), "dd MMMM yyyy ⋅ h:mma")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{fixture.venue.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}