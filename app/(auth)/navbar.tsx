import { ModeToggle } from '@/components/ui/mode-toggle'

const Navbar = () => {
  return (
    <nav className='p-4 flex items-center justify-between'>
      <div>
        <h1 className='text-3xl tracking-tighter font-bold'>Smartables</h1>
      </div>
      <div className='w-fit'>
        <ModeToggle  />
      </div>
    </nav>
  )
}

export default Navbar