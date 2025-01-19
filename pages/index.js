import { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Grid, Typography, Container, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar } from '@mui/material';
import { CSVLink } from 'react-csv';

export default function Home() {
  const [keywords, setKeywords] = useState('');
  const [page, setPage] = useState(1);
  const [lci, setLci] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [csvFile, setCsvFile] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!keywords || !lci) {
      setError('Please provide both keywords and LCI value.');
      return;
    }

    setLoading(true);
    setResults([]);
    setCsvFile('');
    try {
      const response = await axios.post('/api/scrape', {
        keywords: keywords.split(','),
        page,
        lci
      });

      if (response.data.success) {
        setResults(response.data.data);
        setCsvFile(response.data.file);
      } else {
        setError('Something went wrong while scraping.');
      }
    } catch (err) {
      setError('An error occurred while scraping.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Google Local Services Scraper
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Keywords (comma separated)"
            fullWidth
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="LCI Value"
            fullWidth
            value={lci}
            onChange={(e) => setLci(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Page Number"
            type="number"
            fullWidth
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            variant="outlined"
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Start Scraping'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={() => setError('')}
          message={error}
        />
      )}

      {results.length > 0 && (
        <div>
          <Typography variant="h5" gutterBottom>
            Results
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Website</TableCell>
                  <TableCell>Reviews</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.address}</TableCell>
                    <TableCell>{result.phone}</TableCell>
                    <TableCell>{result.website}</TableCell>
                    <TableCell>{result.reviews}</TableCell>
                    <TableCell>{result.rating}</TableCell>
                    <TableCell>{result.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {csvFile && (
            <div style={{ marginTop: '20px' }}>
              <CSVLink
                data={results}
                filename={csvFile.split('/').pop()}
                className="btn"
                target="_blank"
              >
                <Button variant="contained" color="secondary">
                  Download CSV
                </Button>
              </CSVLink>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
