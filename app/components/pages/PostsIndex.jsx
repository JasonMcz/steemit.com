import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import Topics from './Topics';
import constants from 'app/redux/constants';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import PostsList from 'app/components/cards/PostsList';
import {isFetchingOrRecentlyUpdated} from 'app/utils/StateFunctions';

class PostsIndex extends React.Component {

    static propTypes = {
        discussions: PropTypes.object,
        status: PropTypes.object,
        routeParams: PropTypes.object,
        requestData: PropTypes.func,
        loading: PropTypes.bool
    };

    constructor() {
        super();
        this.loadMore = this.loadMore.bind(this);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'PostsIndex')
    }

    componentDidUpdate(prevProps) {
        if (window.innerHeight && window.innerHeight > 3000 && prevProps.discussions !== this.props.discussions) {
            this.refs.list.fetchIfNeeded();
        }
    }

    getPosts(order, category) {
        const topic_discussions = this.props.discussions.get(category || '');
        if (!topic_discussions) return null;
        return topic_discussions.get(order);
    }

    loadMore(last_post) {
        if (!last_post) return;
        const {order = constants.DEFAULT_SORT_ORDER, category} = this.props.routeParams;
        if (isFetchingOrRecentlyUpdated(this.props.status, order, category)) return;
        const [author, permlink] = last_post.split('/');
        this.props.requestData({author, permlink, order, category});
    }

    render() {
        const {order = constants.DEFAULT_SORT_ORDER, category} = this.props.routeParams;
        const posts = this.getPosts(order, category);

        const status = this.props.status ? this.props.status.getIn([category || '', order]) : null;
        const fetching = (status && status.fetching) || this.props.loading;

        return (
            <div className={'PostsIndex row' + (fetching ? ' fetching' : '')}>
                <div className="PostsIndex__left column small-collapse">
                    <div className="PostsIndex__topics_compact show-for-small hide-for-large">
                        <Topics order={order} current={category} compact />
                    </div>
                    <PostsList ref="list" posts={posts ? posts.toArray() : []} loading={fetching} category={category} loadMore={this.loadMore} />
                </div>
                <div className="PostsIndex__topics column shrink show-for-large">
                    <Topics order={order} current={category} compact={false} />
                </div>
            </div>
        );
    }
}

module.exports = {
    path: ':order(/:category)',
    component: connect(
        (state) => {
            return {
                discussions: state.global.get('discussion_idx'),
                status: state.global.get('status'),
                loading: state.app.get('loading')
            };
        },
        (dispatch) => {
            return {
                requestData: (args) => dispatch({type: 'REQUEST_DATA', payload: args})
            }
        }
    )(PostsIndex)
};
