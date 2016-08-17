/**
 * Event Class
 *
 * Used for rendering an event.
 */
var Event = React.createClass({
    // We use remarkable in order to offer the ability to format description and location text.
    // By default React won't allow formatting since it prevents XSS attacks.
    rawDescriptionMarkup: function() {
        var md = new Remarkable();
        var rawMarkup = md.render(this.props.description.toString());
        return { __html: rawMarkup };
    },
    rawLocationMarkup: function() {
        var md = new Remarkable();
        var rawMarkup = md.render(this.props.location.toString());
        return { __html: rawMarkup };
    },
    render: function() {
        return (
            <div className="event">
                <h4 className="event-data">
                    {this.props.children[0]} to {this.props.children[1]}
                </h4>
                <span dangerouslySetInnerHTML={this.rawDescriptionMarkup()} />
                <span dangerouslySetInnerHTML={this.rawLocationMarkup()} />
            </div>
        );
    }
});

/**
 * EventList class
 *
 * Used as a container for events.
 */
var EventList = React.createClass({
    render: function() {
        var eventNodes = this.props.data.map(function(event) {
            console.log(event);
            return (
                <Event description={event.description} id={event.id} location={event.location}>
                    {event.fromDate}
                    {event.toDate}
                </Event>
            );
        });
        return (
            <div className="event-list">
                {eventNodes}
            </div>
        );
    }
});

/**
 * EventForm class
 *
 * Used for rendering a form in order to add an event.
 */
var EventForm = React.createClass({
    getInitialState: function() {
        return {
            description: '',
            date_format: 'Y/m/d H:i',
            from_date:   '',
            to_date:     '',
            location:    '',
            comment:     ''
        };
    },
    handleDescriptionChange: function(e) {
        this.setState({description: e.target.value});
    },
    handleFromDateChange: function(e) {
        this.setState({from_date: e.target.value});
    },
    handleToDateChange: function(e) {
        this.setState({to_date: e.target.value});
    },
    handleLocationChange: function(e) {
        this.setState({location: e.target.value});
    },
    handleCommentChange: function(e) {
        this.setState({comment: e.target.value});
    },
    handleSubmit: function(e) {
        // Prevent browser submit form action.
        e.preventDefault();
        var description = this.state.description.trim();
        var from_date   = this.state.from_date.trim();
        var to_date     = this.state.to_date.trim();
        var location    = this.state.location.trim();
        var comment     = this.state.comment.trim();

        /*
         * Do a quick validation. Please note that comment is an optional parameter.
         */
        if (!description || !from_date || !to_date || !location) {
            return;
        }
        this.props.onEventSubmit({
            description: description,
            date_format: this.state.date_format,
            from_date:   from_date,
            to_date:     to_date,
            location:    location,
            comment:     comment
        });
        this.setState({
            description: '',
            from_date:   '',
            to_date:     '',
            location:    '',
            comment:     ''
        });
    },
    render: function() {
        return (
            <div className="container-fluid bg-2 text-center">
                <h2>Add an event</h2>
                <form id="eventForm" className="event-form form-horizontal" onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <div className="col-sm-offset-4 col-sm-4">
                            <input type="text" className="form-control" placeholder="Description" value={this.state.description} onChange={this.handleDescriptionChange} />
                        </div>
                        <div className="col-sm-offset-4 col-sm-4">
                            <input type="text" id="fromDate" className="form-control" placeholder="From Date" value={this.state.from_date} onChange={this.handleFromDateChange} />
                        </div>
                        <div className="col-sm-offset-4 col-sm-4">
                            <input type="text" id="toDate" className="form-control" placeholder="To Date" value={this.state.to_date} onChange={this.handleToDateChange} />
                        </div>
                        <div className="col-sm-offset-4 col-sm-4">
                            <input type="text" className="form-control" placeholder="Location" value={this.state.location} onChange={this.handleLocationChange} />
                        </div>
                        <div className="col-sm-offset-4 col-sm-4">
                            <input type="text" className="form-control" placeholder="Comment" value={this.state.comment} onChange={this.handleCommentChange} />
                        </div>
                        <input type="hidden" name="date_format" value={this.state.date_format} />
                        <div className="col-sm-offset-4 col-sm-4">
                            <input type="submit" className="btn btn-default btn-lg" value="POST" />
                        </div>
                    </div>
                </form>
            </div>
        );
    }
});

/**
 * EventBox class
 *
 * Used as the main container and responsible for getting
 * events data and handling form submission.
 *
 * @method componentDidMount called automatically by React after a component is rendered for the first time.
 */
var EventBox = React.createClass({
    getInitialState: function() {
        return {data: []};
    },
    loadEventsFromServer: function() {
        $.ajax({
            type: "GET",
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({data: data.data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    handleEventSubmit: function(event) {
        $.ajax({
            url: this.props.addUrl,
            dataType: 'json',
            type: 'POST',
            data: event,
            success: function(data) {
                console.log('Event added:');
                console.log(data);
                this.loadEventsFromServer();
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    componentDidMount: function() {
        this.loadEventsFromServer();
        setInterval(this.loadEventsFromServer, this.props.pollInterval);
    },
    render: function() {
        return (
            <div className="event-box bg-1 text-center">
                <h3>Latest Events</h3>
                <EventList data={this.state.data} />
                <EventForm onEventSubmit={this.handleEventSubmit} />
            </div>
        );
    }
});

/**
 * Instantiate the root component, start the framework and inject the markup into the raw DOM element.
 *
 * @prop url          The endpoint for fetching events data.
 * @prop addUrl       The endpoint for adding a new event.
 * @prop pollInterval Interval used for refreshing the event data in case other users post an event
 */
ReactDOM.render(
    <EventBox url="http://calendar51.local/event/all" addUrl="http://calendar51.local/event/add" pollInterval={100000} />,
    document.getElementById('content')
);
