import { store } from 'san-store';
import { updateBuilder } from 'san-update';
import service from './service';
import config from '../common/config';
import { whenNoError } from '../common/action';


export const Types = {
    FETCH: 'articleFetch',
    FETCHING: 'articleFetching',
    FETCH_FILL: 'articleFetchFill',
    TAGS: 'articleTags',
    TAGS_FILL: 'articleTagsFill',
    ADD: 'articleAdd',
    EDIT: 'articleEdit',
    REMOVE: 'articleRemove',
    RESET: 'articleReset',
    SET: 'articleSet',
    SET_AUTHOR: 'articleSetAuthor',
    SET_LIST_ITEM: 'articleSetListItem',
    GET: 'articleGet',
    ADD_TAG: 'articleAddTag',
    REMOVE_TAG: 'articleRemoveTag',
    ADD_COMMENT: 'articleAddComment',
    GET_COMMENTS: 'articleGetComments',
    FILL_COMMENTS: 'articleFillComments',
    REMOVE_COMMENT: 'articleRemoveComment',
    ADD_FAVORITE: 'articleAddFavorite',
    REMOVE_FAVORITE: 'articleRemoveFavorite'
};

store.addAction(Types.FETCH, function (payload, {dispatch}) {
    let params = {
        limit: config.PAGE_SIZE,
        offset: config.PAGE_SIZE * (payload.page || 0)
    };

    let fetch = service.fetch;
    if (payload.feed) {
        fetch = service.fetchFeed;
    }
    else {
        if (payload.author) {
            params.author = payload.author;
        }

        if (payload.tag) {
            params.tag = payload.tag;
        }

        if (payload.favorited) {
            params.favorited = payload.favorited;
        }
    }

    dispatch(Types.FETCHING);
    return fetch(params).then(response => {
        dispatch(Types.FETCH_FILL, response.data);
    });
});

store.addAction(Types.FETCHING, function () {
    return updateBuilder().set('articlesLoading', true);
});

store.addAction(Types.FETCH_FILL, function ({articles, articlesCount}) {
    return updateBuilder()
        .set('articles', articles)
        .set('articleCount', articlesCount)
        .set('articlesLoading', false)
        .set('articlePageCount', Math.ceil(articlesCount / config.PAGE_SIZE));
});

store.addAction(Types.TAGS, function (payload, {dispatch}) {
    return service.tags().then(response => {
        dispatch(Types.TAGS_FILL, response.data);
    });
});

store.addAction(Types.TAGS_FILL, function (data) {
    return updateBuilder().set('tags', data.tags);
});

store.addAction(Types.RESET, function () {
    return updateBuilder()
        .set('article', {
            author: {},
            title: "",
            description: "",
            body: "",
            tagList: []
        })
        .set('comments', []);
});

store.addAction(Types.GET, function (slug, {dispatch}) {
    return service.get(slug).then(({data}) => {
        dispatch(Types.SET, data.article);
    });
});

store.addAction(Types.SET, function (article) {
    return updateBuilder().set('article', article);
});

store.addAction(Types.SET_AUTHOR, function (author) {
    return updateBuilder().set('article.author', author);
});

store.addAction(Types.ADD_TAG, function (tag) {
    return updateBuilder().push('article.tagList', tag);
});

store.addAction(Types.REMOVE_TAG, function (tag) {
    return updateBuilder().remove('article.tagList', tag);
});

store.addAction(Types.REMOVE, function (slug) {
    return service.remove(slug);
});

store.addAction(Types.ADD, function (article, {dispatch}) {
    return service.add(article).then(whenNoError());
});

store.addAction(Types.EDIT, function (article, {dispatch}) {
    return service.update(article.slug, article).then(whenNoError());
});

store.addAction(Types.ADD_COMMENT, function (payload, {dispatch}) {
    return service.addComment(payload.slug, payload.comment)
        .then(() => {
            dispatch(Types.GET_COMMENTS, payload.slug);
        });
});

store.addAction(Types.GET_COMMENTS, function (slug, {dispatch}) {
    return service.getComments(slug).then(({data}) => {
        dispatch(Types.FILL_COMMENTS, data.comments);
    });
});


store.addAction(Types.FILL_COMMENTS, function (comments) {
    return updateBuilder().set('comments', comments);
});

store.addAction(Types.REMOVE_COMMENT, function (payload, {dispatch}) {
    return service.removeComment(payload.slug, payload.commentId)
        .then(() => {
            dispatch(Types.GET_COMMENTS, payload.slug);
        });
});

store.addAction(Types.ADD_FAVORITE, function (slug, {dispatch}) {
    return service.addFavorite(slug).then(
        ({data}) => {
            dispatch(Types.SET, data.article);
            dispatch(Types.SET_LIST_ITEM, data.article);
        }
    );
});

store.addAction(Types.REMOVE_FAVORITE, function (slug, {dispatch}) {
    return service.removeFavorite(slug).then(
        ({data}) => {
            dispatch(Types.SET, data.article);
            dispatch(Types.SET_LIST_ITEM, data.article);
        }
    );
});

store.addAction(Types.SET_LIST_ITEM, function (article, {getState}) {
    let articles = getState('articles');

    if (articles) {
        for (let i = 0; i < articles.length; i++) {
            if (articles[i].slug === article.slug) {
                return updateBuilder().set('articles[' + i + ']', article);
            }
        }
    }
});





