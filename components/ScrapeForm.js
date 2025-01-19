// components/ScrapeForm.js

import React, { useState } from "react";
import { TextField, Button, Grid, InputAdornment, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import debounce from "lodash.debounce";

// Theme Colors
const theme = {
  primary: "#002B5C", // Deep Navy
  secondary: "#FF7900", // Vibrant Orange
  background: "#ffffff", // Cool White
};

const ScrapeForm = ({ setKeywords, setLci, handleScrape, loading }) => {
  const [inputKeywords, setInputKeywords] = useState(""); // Raw input for keywords
  const [lciValue, setLciValue] = useState(0); // Default LCI value (for result range)
  const [error, setError] = useState("");

  const RESULTS_PER_PAGE = 20;

  const debouncedSetKeywords = debounce((value) => {
    const keywordsArray = value.split(",").map((keyword) => keyword.trim());
    setKeywords(keywordsArray);
  }, 300);

  const handleKeywordsChange = (e) => {
    const value = e.target.value;
    setInputKeywords(value);
    debouncedSetKeywords(value);
  };

  const getResultRange = () => {
    const start = lciValue + 1;
    const end = lciValue + RESULTS_PER_PAGE;
    return `${start} – ${end}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputKeywords.trim()) {
      setError("Please provide valid keywords.");
      return;
    }
    setError("");
    await handleScrape(inputKeywords.trim());
  };

  const handleNext = () => {
    setLciValue((prev) => {
      const newLci = prev + RESULTS_PER_PAGE;
      setLci(newLci);
      handleScrape();
      return newLci;
    });
  };

  const handlePrev = () => {
    setLciValue((prev) => {
      const newLci = Math.max(prev - RESULTS_PER_PAGE, 0);
      setLci(newLci);
      handleScrape();
      return newLci;
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Keyword Input */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Enter Keywords"
            placeholder="Distributors, Suppliers, Manufacturers, etc."
            variant="outlined"
            value={inputKeywords}
            onChange={handleKeywordsChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: theme.background,
            }}
          />
        </Grid>

        {/* Result Range Controls */}
        <Grid item xs={12}>
          <Typography align="center" variant="h6" sx={{ mb: 2 }}>
            Showing Results: <strong>{getResultRange()}</strong>
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="outlined"
                color="primary"
                onClick={handlePrev}
                disabled={loading || lciValue === 0}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: "bold",
                  borderColor: theme.primary,
                  color: theme.primary,
                  ":hover": {
                    backgroundColor: theme.primary,
                    color: theme.background,
                  },
                }}
              >
                Previous
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleNext}
                disabled={loading}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: "bold",
                  borderColor: theme.secondary,
                  color: theme.secondary,
                  ":hover": {
                    backgroundColor: theme.secondary,
                    color: theme.background,
                  },
                }}
              >
                Next
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{
          py: 1,
          backgroundColor: theme.secondary,
          ":hover": {
            backgroundColor: "#e15c00",
          },
          fontWeight: "bold",
          boxShadow: 3,
        }}
      >
        {loading ? "Scraping..." : "Start Scraping"}
      </Button>
    </form>
  );
};

export default ScrapeForm;
