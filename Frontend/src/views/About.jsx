//About Page for App

export default function AboutPage() {
    return (
        <div style={styles.page}>
            <h2>About</h2>
            <div style={styles.paragraph}>
                <p>This site provides a central repository for Live WNBA games,
                including score updates, player statistics, and standings.<br />
                <br />
                Check in during the season to see how your favorite team is doing <br />
                <br />
                Coming soon: Historical performance tracking: Get notified if any players are on track for career highs <br />
                <br />
                Created by: Sam Hurlburt (Add me on linkedin... (pls))
                </p>
            <div style = {styles.page}>
                <h2>
                    <a href = "https://github.com/hurlburtsam/WNBA-Live-Tracker/tree/main" 
                        target = "_blank"
                        rel = "noopener noreferrer" >Link to GitHub
                    </a>
                </h2>
            </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        maxWidth: 900,
        margin: '0 auto',
        padding: 20, 
        textAlign: 'center',
        backgroundColor: '#fff5eb'
    },
    paragraph: {
        maxWidth:900,
        margin: '0 auto',
        padding: 20,
        textAlign: 'left',
    }
}