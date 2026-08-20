import { Link } from 'react-router-dom';

export default function sidebar() {
    return (
        <nav style={styles.sidebar}>
            <Link to="/" style = {styles.Link}>Home</Link> 
            <Link to="/Standings" style={styles.Link}>Standings</Link>
            <Link to="/Teams" style={styles.Link}>Teams</Link>
            <Link to= "/About" style={styles.Link}>About</Link>
            <Link to="/Contact" style={styles.Link}>Contact</Link>
        </nav>
    );
}

const styles = {
    sidebar: {
        display:'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        width: 200,
        flexShrink: 0,
    },
    Link: {
        color: 'inherit',
        textDecoration: 'none',
    }
}