import ResponseHelper from 'bun-fetch-helper';

const responseHelper = new ResponseHelper();

// Use in a Bun fetch handler
export default {
    fetch(request: Request): Response {
            return responseHelper.html('<h1>Hello, Bun!</h1>');
                }
                };
