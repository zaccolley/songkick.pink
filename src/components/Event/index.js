import { h, Component } from 'preact';
import style from './style';

import Icon from '../Icon';
import Badge from '../Badge';

// DO NOT COMMIT ME

// DO NOT COMMIT ME
const citymapperApiKey = 'a73004e1c8dc337e578041981b241533';

// DO NOT COMMIT ME

// DO NOT COMMIT ME


export default class Event extends Component {

  state = {
    shareButtonVisible: false
  }
  componentDidMount() {
    const { lat, lon, covered } = this.state;
    const { events, id } = this.props;
    const event = events.find(event => event.id === +id);

    if (!lat && !lon && (typeof covered === 'undefined') && event) {
      this.getLocation().then(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        this.setState({ lat, lon });

        this.constructCityMapperUri();

        this.travelTime();
      });
    }
  }

  componentWillMount() {
    this.isShareAvailable();
  }

  getLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, error => {
        console.error('Couldnt get user location');
        if (error.code.TIMEOUT) {
          console.error("The user didn't accept the callout");
          reject();
        }
      });
    });
  }

  constructCityMapperUri() {
    const { events, id } = this.props;
    const event = events.find(event => event.id === +id);
    const { lat, lon } = this.state;
    console.log('ok', !lat, !lon, !event)
    if (!lat || !lon || !event) {
      return;
    }

    let citymapperUri = `https://citymapper.com/directions?endcoord=${event.place.lat},${event.place.lon}&endname=${event.place.name}&endaddress=${event.place.name},${event.place.city},${event.place.country}`;
    console.log(citymapperUri)

    if (lat && lon) {
      citymapperUri += `&startcoord=${lat},${lon}`;
    }

    // if event has a valid time
    if (event.time.iso) {
      citymapperUri += `&arriveby=${event.time.iso}`;
    }

    this.setState({ citymapperUri });
  }

  travelTime() {
    const { events, id } = this.props;
    const event = events.find(event => event.id === +id);

    const { lat, lon } = this.state;
    fetch('/api/citymapper', {
      method: 'POST',
      body: JSON.stringify({ lat, lon, event }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(travelTime => this.setState({ ...travelTime }))
    .catch(console.error);
  }

  formatDate(date) {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  }

  getDates(event) {
    const HOURS = 3;
    const start =  new Date(event.time.iso);
    const end = new Date(start);
    end.setHours(end.getHours() + HOURS);

    return {
      start: this.formatDate(start),
      end: this.formatDate(end)
    };
  }

  googleCalendar() {
    const { events, id } = this.props;
    const event = events.find(event => event.id === +id);

    const title = event.title ? event.title : event.performances[0].name;

    const dates = this.getDates(event);

    const href = encodeURI([
      'https://www.google.com/calendar/render',
      '?action=TEMPLATE',
      `&text=🎶 ${title} @ ${event.place.name}`,
      `&dates=${dates.start}/${dates.end}`,
      `&details=${event.uri}`,
      `&location=${event.place.address}`,
      '&sprop=&sprop=name:'
    ].join(''));

    return href;
  }

  isShareAvailable() {
    if ('share' in navigator) {
      this.setState({ shareButtonVisible: true });
    }
  }

  handleShare() {
    const { events, id } = this.props;
    const event = events.find(event => event.id === +id);

    const title = event.title ? event.title : event.performances[0].name;

    navigator.share({
      title,
      text: `🎶 Check out: ${title} @ ${event.place.name}.`,
      url: event.uri
    })
    .then(() => console.log('Successful share'))
    .catch(error => console.log('Error sharing:', error));
  }

  render() {
    const { events, id } = this.props;
    const { citymapperUri, travelTime, shareButtonVisible } = this.state;

    const event = events.find(event => event.id === +id);

    let EventItem;
    let title;

    if (event) {
      title = event.title ? event.title : event.performances.map(performance => (
        <a class={style[performance.type]} href={`https://www.songkick.com/artists/${performance.id}`} >
          {performance.name}
        </a>
      ));

      EventItem = (
      <div>
        <Badge event={event} />

        <time class={style.date} datetime={event.time.iso}>
          {event.time.pretty.full}
        </time>

        <h1 class={style.title}>{title}</h1>
        <h3 class={style.place}>{event.place.name}</h3>

        <section>
          <h4><Icon name="shoppingCart" /> Tickets</h4>
          <a class={`${style.button} ${style.buttonPrimary}`} href={event.uri} target="_blank">
            Buy tickets! <Icon name="external" style={{ marginLeft: '0.25em', float: 'right' }} />
          </a>
        </section>

        <section>
          <h4><Icon name="pin" /> Venue & Directions</h4>
          <p>{event.place.name}</p>
          <p><small>{event.place.city}, {event.place.country}</small></p>
          <a class={style.button} href={(travelTime && citymapperUri) ? citymapperUri : `http://maps.google.com/?q=${event.place.name}`} target="_blank">
            Get directions here… <Icon name="external" style={{ marginLeft: '0.25em', float: 'right' }} />
          </a>
          {travelTime ? <small>(~{travelTime} mins)</small> : ''}
        </section>

        <section>
          <h4><Icon name="clock" /> Doors Open</h4>
          <p>{event.time.pretty.doors}</p>
        </section>

        <section>
          <h4><Icon name="musicNote" /> Lineup</h4>
          <ol>
            {event.performances.map(performance => (
              <li class={style.artist}>
                <a href={`https://www.songkick.com/artists/${performance.id}`}>
                  <img src={performance.image.src} style={performance.image.color ? {backgroundColor: performance.image.color} : {}} alt={`Image of ${performance.name}`} />
                  <span class={performance.type === 'headline' ? style.headliner : {}}>{performance.name}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      </div>
      );
    }

    return (
      <div>
        <div class={style.animateIn} style={{ overflow: 'hidden' }}>
          <div class={style.headerImage}>
            <div class={style.headerButtons}>
              <a href={this.googleCalendar()} target="_blank">
                <Icon name="calendar" />
              </a>
              {shareButtonVisible && (
              <button onClick={this.handleShare.bind(this)}>
                <Icon name="share" />
              </button>
              )}
            </div>
            {event && (
              <img
                src={event.image.src}
                style={event.image.color ? {backgroundColor: event.image.color} : {}}
                alt="Image for event" />
            )}
          </div>
        </div>
        <div class={`${style.animateIn} ${style.animateInUp}`}>
        <div class={`${style.page} ${style.panel}`}>
          {EventItem}
        </div>
        </div>
      </div>
    );
  }
}
