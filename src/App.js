import { 
  useState, useEffect,
} from 'react';

import Map from './components/Map';
import Sources from './components/Sources';
import Details from './components/Details';
import Census from './components/Census';
import Race from './components/Race';
import Legend from './components/Legend';
import { mapColor } from './components/utils';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import { Typeahead } from 'react-bootstrap-typeahead'; 

import axios from 'axios';
import { addData, processSheet, lookupRef } from './utils';
import { group } from 'd3-array';
import { initFrameAndPoll } from '@newswire/frames';

import './App.scss';
import 'react-bootstrap-typeahead/css/Typeahead.css';

function App() {
  const [allData, setAllData] = useState(null);
  const [lookup, setLookup] = useState(null);
  const [shapeFile, setShapeFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);

  const [filterOptions, setFilterOptions] = useState({
    language: [],
    county: [],
    ownership: [],
    sector: [],
    search: [],
  });

  const [formOptions, setFormOptions] = useState({
    language: [],
    county: [],
    ownership: [],
    sector: [],
    search: []
  });

  useEffect(() => {
    function getData() {
      const mainSheet = axios.get('mainstream.json');
      const geoJson = axios.get('map.json');

      axios.all([mainSheet, geoJson])
        .then(axios.spread((...responses) => {
          const parsedMain = processSheet(responses[0].data.data);
          const shapeData = addData(responses[1].data, parsedMain);
          const initDetails = parsedMain.filter(d => d.STATEWIDE === 'x');
          
          setAllData(parsedMain);
          setLookup(lookupRef(parsedMain, 'COUNTY', 'SECTOR'));
          setShapeFile(shapeData);

          const sectorOptions = Array.from(group(parsedMain, d => d.SECTOR))
            .sort((a, b) => b[1].length - a[1].length)
            .map(d => d[0]);

          // console.log(sectorOptions)

          setFormOptions({
            language: [...new Set(parsedMain.map(d => d['NON-ENGLISH/ BIPOC-SERVING']))].sort(),
            county: [...new Set(parsedMain.map(d => d.COUNTY))].sort(),
            ownership: [...new Set(parsedMain.map(d => d.OWTYPE))].sort(),
            sector: sectorOptions,
          });

          setDetails({ 
            header: 'Statewide news outlets', 
            data: initDetails 
          });
        }))
        .catch(errors => {
          console.log(errors);
        });
    };
    getData();
    initFrameAndPoll(150);
  }, []);

  const mapFilter = (f) => {
    if(lookup.get(f.properties.NAME)) {
      filterChange('county', [ f.properties.NAME ]);

      const countySourceSummary = lookup.get(f.properties.NAME);
      f.properties.source_summary = [];      

      countySourceSummary.forEach((_v, key) => {
        f.properties.source_summary.push([key, _v.length]);
      });

      f.properties.source_summary = f.properties.source_summary.sort((a, b) => b[1] - a[1]);
    }
    setSummary(f);
      
    const sourceDetails = allData.filter(d => d.COUNTY === f.properties.NAME);
      
    if (sourceDetails.length) {
      setDetails({ 
        header: `News sources in ${f.properties.NAME} County`, 
        data: sourceDetails
      });
    } else {
      setDetails({ header: '', data: []});
    }
  };

  const buttonHandler = (e, key) => {
    const hedText = {
      'STATEWIDE': 'Statewide news outlets',
      'COLab': 'COLab news outlets',
      'CPA': 'CPA news outlets',
      'All': 'All news outlets',
    };

    const btnData = (key === 'All') ? allData : allData.filter(d => d[key] === 'x');
    
    setDetails({ 
      header: hedText[key], 
      data: btnData
    });
  }

  const filterChange = (key, value) => {
    const updatedValues = {};
    updatedValues[key] = value;
  
    setFilterOptions((prevState) => {
      return {...prevState, ...updatedValues};
    });
  };

  const resetSummary = () => setSummary(null);

  useEffect(() => {
    if (allData) {
      // console.log(filterOptions);
      
      const filterKeys = {
        county: 'COUNTY',
        language: 'NON-ENGLISH/ BIPOC-SERVING',
        ownership: 'OWTYPE',
        sector: 'SECTOR',
        search: 'OUTLET'
      };

      let filterValues = {};

      Object.keys(filterKeys).forEach(fk => {
        if (filterOptions[fk].length) {
          filterValues[fk] = filterOptions[fk];
        } else if (fk === 'search') {
          filterValues[fk] = [];
        } else {
          filterValues[fk] = [...new Set(allData.map(d => d[filterKeys[fk]]))];
        }
      });

      // console.log(filterValues);
      const refreshData = allData.filter(row => 
        filterValues.county.includes(row['COUNTY']) && 
        filterValues.language.includes(row['NON-ENGLISH/ BIPOC-SERVING']) && 
        filterValues.ownership.includes(row['OWTYPE']) &&
        filterValues.sector.includes(row['SECTOR']) && 
        // row['OUTLET'].toLowerCase().indexOf(filterValues.search[0]) > -1
        (filterValues.search.length > 0 ? 
            row['OUTLET'].toLowerCase().indexOf(filterValues.search[0]) > -1
            : true)
      );
      
      setDetails({
        header: '',
        data: refreshData
      });
    }

  }, [allData, filterOptions]);

  let colorArray = [
    'step', 
    ['number', ['get', 'total_sources']],
  ];

  mapColor().forEach(pair => {
    colorArray.push(pair[1]);
    colorArray.push(pair[0]);
  });

  colorArray.push('#2c2e42');

  const fillColor = {
    id: 'colorado',
    type: 'fill',
    paint: {
      'fill-outline-color': '#fafafa',
      'fill-color': colorArray,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.3,
        1,
      ],
    }
  };

  if (shapeFile) {
    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <h1 className='App__hed bold'>Colorado News Mapping Project</h1>
            <p className="App__desc">Where do Coloradans find their local news and community information, and what do we know about these sources? This map contains credentialed sources of local journalism &mdash; including newspapers, TV and radio stations, and digital news sites &mdash; and other sources that share or produce civic information &mdash; including community groups, organizational pages, and individuals.</p>
            <p className="App__desc">This map is a work in progress. It was created by people from the Colorado College Journalism Institute, the University of Denver, Colorado Media Project, Hearken, the Colorado News Collaborative (COLab), and others. This work is supported by a grant administered by the Online News Association with support from the Democracy Fund, Knight Foundation, the Inasmuch Foundation, and Scripps Howard Foundation.</p>

            <p className="App__desc">Corey Hutchins writes more about the map, why it matters and how it came together <a href="https://colabnews.co/colorado-news-mapping-project-method/" target='_parent'>here</a>.</p>
            
            <ul>
              <li><p className="App__desc"><strong>Hover over each county</strong> to see the number of local information sources identified to date, and the number of original, local news stories produced by some of the news sources in that county that researchers counted on a single weekday in 2021. (Counties that don’t show a number of original and local stories hadn’t produced any for the day we researched.) NOTE: News sources are placed on the map according to their physical office address, which means some might not appear in counties they also serve.</p>
              </li>
              <li><p className="App__desc"><strong>Click or tap on a county</strong> to learn more about its news and information ecosystem and demographics, and to see a full list of the news and information sources we’ve identified so far along with media type, sector, ownership, language, and reach (if we know it).</p></li>
            </ul>

            <p className="App_desc"><strong>Did we miss something? Did you find an error?</strong> Fill out <a href="https://docs.google.com/forms/d/e/1FAIpQLSdY3GCM61wsEVdEUpEJ6x6yErooyerovADATMby-IR7wdtkxQ/viewform" target='_parent'>this form</a> and let us know so we can fix it. </p>
          </Col>
          
          <Legend />
        </Row>
        <Row>
          <Col xs={12} md={6} lg={7}>
            <Map 
              source={ shapeFile } 
              fill={ fillColor }
              passData={ mapFilter }
              data-testid='map'>
            </Map>
          </Col>

          <Col xs={12} md={6} lg={5}>
            {summary &&
              (
                <div>
                  <h4 className='summary__hed'>{ summary.properties.NAME } County</h4>
                  <Census feature={ summary }/>

                  <Row>
                    <Col sm={6}>
                      <p className='summary__demographics'><strong>News Sources by Sector</strong></p>
                      <Sources 
                        type='mainstream' 
                        county={summary.properties.NAME} 
                        sources={summary.properties.source_summary}
                        refreshTable={ (obj) => filterChange('sector', obj.sector) } 
                      />
                    </Col>

                    <Col sm={6}>
                      <p className='summary__demographics'><strong>County Demographics</strong></p>
                      <Race feature={summary} />
                    </Col>
                  </Row>                 
                </div>
              )}
          </Col>
        </Row>

        <div className="spacer"></div>

        <Row>
          <Col>
            <div className="button-filters">
              <Button onClick={e => buttonHandler(e, 'STATEWIDE') } variant="outline-dark" className='filter-table-btn'>Statewide outlets</Button>
              <Button onClick= {e => buttonHandler(e, 'COLab') } variant="outline-dark" className='filter-table-btn'>COLab partners</Button>
              <Button onClick= {e => buttonHandler(e, 'CPA') } variant="outline-dark" className='filter-table-btn'>CPA members</Button>
              <Button onClick= {e => buttonHandler(e, 'All') } variant="outline-dark" className='filter-table-btn'>Show all</Button>
            </div>
          </Col>
        </Row>

        <div className="table-filter">
          <Row>
             <Col xs={12} md={3}>
              <Form.Group style={{ marginTop: '20px' }}>
                <Form.Label>County</Form.Label>
                <Typeahead
                  id="table-county-filter"
                  className='table-filter__form table-filter__county'
                  labelKey="county"
                  multiple
                  onChange={(selected) => {
                    if (!selected.length) {
                      resetSummary();
                    } 
                    filterChange('county', selected);
                  }}
                  options={formOptions.county}
                  placeholder="Select a county"
                  selected={filterOptions.county}
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group style={{ marginTop: '20px' }}>
                <Form.Label>Sector</Form.Label>
                <Typeahead
                  id="table-sector-filter"
                  labelKey="sector"
                  className='table-filter__form table-filter__sector'
                  multiple
                  onChange={(selected) => filterChange('sector', selected)}
                  options={formOptions.sector}
                  placeholder="Type of local news source"
                  selected={filterOptions.sector}
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group style={{ marginTop: '20px' }}>
                <Form.Label>Language</Form.Label>
                <Typeahead
                  id="table-language-filter"
                  className='table-filter__form table-filter__language'
                  labelKey="name"
                  multiple
                  // onInputChange={(text, string) => {console.log(text,string)}}
                  onChange={ (sel) => filterChange('language', sel) }
                  options={formOptions.language}
                  placeholder="Select a language"
                  selected={filterOptions.language}
                />
              </Form.Group>
            </Col>
           

            <Col xs={12} md={3}>
              <Form.Group style={{ marginTop: '20px' }}>
                <Form.Label>Ownership</Form.Label>
                <Typeahead
                  id="table-ownership-filter"
                  labelKey="owner"
                  className='table-filter__form table-filter__owner'
                  multiple
                  onChange={(selected) => filterChange('ownership', selected)}
                  options={formOptions.ownership}
                  placeholder="Ownership type"
                  selected={filterOptions.ownership}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col xs={12} md={4}>
              <Form.Group className='table-filter__outlet'>
                <Form.Label>Search for a local news and info source</Form.Label>
                <Form.Control type="text" placeholder="Search" 
                  onChange={ e => filterChange('search', [ e.target.value ]) }
                />
                {/*<Form.Text className="text-muted">
                  We'll never share your email with anyone else.
                </Form.Text>*/}
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="spacer"></div>

        <Row>
          <Col xs={12}>
            { details && 
              (<Details data-testid='statewide' mainstream={ details } />)
            }
          </Col>
          <p className='summary__footnote'><small>Source: County population data are from the 2020 U.S. decennial census. Racial demographics data are from the American Community Survey, 2016-2020.</small></p>
        </Row>
      </Container>
    );
  } else {
    return (
      <div className="loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
}

export default App;
