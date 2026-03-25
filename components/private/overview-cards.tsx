const OverviewCards = ({
  data
}: {
  data: {
    title: string
    value: string | number
    icon: React.ReactNode
    description: string
  }[]
}) => {
  return (
    <div className='grid min-[480px]:grid-cols-3 max-[480px]:gap-4 gap-5 md:bg-card/80 md:rounded-3xl md:border-2'>
      {data.map((item, index) => (
        <div 
          key={index} 
          className='gap-2 p-6 md:first:pl-6 md:pl-2 flex items-start justify-between bg-card/80 md:bg-transparent rounded-3xl md:rounded-none md:border-r-2 border-2 md:border-l-0 md:border-y-0 md:last:border-r-0'
        >
          <div className="flex flex-col items-start justify-between h-full gap-2 md:gap-1">
            <div>
              <h2>{item.title}</h2>
            </div>
            <div className='flex items-end gap-1.5'>
              <p className='text-3xl font-bold'>
                {item.value}
              </p>
              <span className='text-xl hidden md:flex text-foreground/80 font-semibold tracking-tight'>
                {item.description}
              </span>
            </div>
          </div>
          <div className='bg-primary/10 border-2 border-primary/20 p-1.5 rounded-lg hidden md:flex'>
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OverviewCards