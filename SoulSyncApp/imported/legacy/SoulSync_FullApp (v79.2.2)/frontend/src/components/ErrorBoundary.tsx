import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean, error?: Error }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: any){ console.error('UI ErrorBoundary', error, info) }
  render(){
    if(this.state.hasError){
      return <div className="p-4 text-red-600">
        <h2 className="text-xl font-semibold">Nešto je pošlo po zlu</h2>
        <p className="mt-2">Pokušajte osvježiti stranicu ili se vratiti na početnu.</p>
        <button className="mt-3 px-3 py-2 rounded bg-gray-200" onClick={()=>this.setState({hasError:false})}>Pokušaj ponovno</button>
      </div>
    }
    return this.props.children as any
  }
}
