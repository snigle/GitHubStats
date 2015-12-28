package controllers

import play.api._
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc._
import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

case class Author(login: String, avatar_url: String)
case class Commit(message: String, author: Author, date: String)

class Application @Inject() (ws: WSClient) extends Controller {

  implicit val authorReader = Json.reads[Author]
  implicit val commitReader = Json.reads[Commit]

  def index() = Action { implicit request =>
    Ok(views.html.index("GitHub Stats"))
  }

  def repo(name: String) = Action { implicit request =>
    Ok(views.html.index(name + " - GitHubStats"))
  }

  def commits(repo: String, page: Int) = Action.async {
    ws.url("https://api.github.com/repos/" + repo + "/commits?page=" + page).withHeaders("Accept" -> "application/json").get.map(response => {
      //      println(response.body);
      //        val commits_json = Json.toJson( Map( "result" -> response.json))
      //      println((commits_json \ "results" \\ "author").asList[Author])
      //        
      Ok(response.json).withHeaders(
        "x-rate-limit-remaining" -> response.header("x-rate-limit-remaining").getOrElse("0"),
        "x-rate-limit-reset" -> response.header("x-rate-limit-reset").getOrElse("0")
      );
    });
  }

  def login(code: String) = Action.async { implicit request =>
    {
      ws.url("https://github.com/login/oauth/access_token").withHeaders("Accept" -> "application/json").post(
        Json.toJson(Map(
          "client_id" -> "023b4b4bb7288038ddc4",
          "client_secret" -> "43f14fe116ac645011d70711d59fdcc0e09a4bbf",
          "code" -> code
        ))
      )
        .map(response => {
          Ok(response.json).withCookies(
            Cookie(
              "access_token",
              (response.json \ "access_token").get.toString,
              Some(60 * 60 * 24 * 7),
              httpOnly = true
            )
          )
        })

    }
  }

}
