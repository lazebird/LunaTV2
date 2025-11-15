'use client';

interface EPGProgram {
  title: string;
  start: string;
  end: string;
  desc?: string;
}

interface EPGInfoProps {
  programs: EPGProgram[];
  currentTime: Date;
}

export const EPGInfo = ({ programs, currentTime }: EPGInfoProps) => {
  const currentProgram = programs.find(p => {
    const start = new Date(p.start);
    const end = new Date(p.end);
    return currentTime >= start && currentTime <= end;
  });

  return (
    <div className='p-4 bg-white dark:bg-gray-800 rounded-lg'>
      {currentProgram ? (
        <>
          <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>{currentProgram.title}</h3>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            {new Date(currentProgram.start).toLocaleTimeString()} - {new Date(currentProgram.end).toLocaleTimeString()}
          </p>
          {currentProgram.desc && <p className='text-sm text-gray-700 dark:text-gray-300 mt-2'>{currentProgram.desc}</p>}
        </>
      ) : (
        <p className='text-sm text-gray-500'>暂无节目信息</p>
      )}
    </div>
  );
};
