import {useSingleton} from '../../dist';

class Theme extends useSingleton.Singleton {
  initialize (state) {
    console.log('initializing...', state);
    return {
      mode: 'light',
      primary: '#000000',
      ...state
    };
  }

  toggleMode = ()=> {
    const {mode} = this.state;
    const new_mode = mode === 'light' ? 'dark' : 'light';
    console.log(`changing to ${new_mode} mode`);
    this.setState({mode: new_mode});
  };

  set primary (primary) {
    this.setState({primary});
  }

  get primary () {
    return this.state.primary;
  }

  get mode () {
    return this.state.mode;
  }

  isDark () {
    return (this.state.mode === 'dark');
  }

  isLight () {
    return (this.state.mode === 'light');
  }

  get name () {
    return this.options.upper(this.state.mode);
  }
}

export default function useTheme () {
  return useSingleton(Theme, {
    state: {
      primary: '#663399'
    },
    upper: (s)=> s.toUpperCase()
  });
}
