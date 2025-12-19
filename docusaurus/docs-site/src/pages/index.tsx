import {useEffect} from 'react';
import {useHistory} from '@docusaurus/router';

export default function Home(): null {
  const history = useHistory();
  
  useEffect(() => {
    // Redirect to documentation immediately
    history.replace('/docs/intro');
  }, [history]);
  
  return null;
}
