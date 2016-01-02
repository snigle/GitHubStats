package controllers

import play.api._
import play.api.libs.json.Json
import play.api.libs.json.Reads
import play.api.libs.ws.WSClient
import play.api.mvc._
import javax.inject.Inject
import play.api.libs.json._
import play.api.libs.functional.syntax._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import scala.concurrent.Await
import scala.concurrent.duration._
import scala.concurrent.Future

case class Author(login: Option[String], name: Option[String], email: Option[String], avatar_url: Option[String], total: Option[Int])
case class Commit(message: String, author: Author, date: String, sha: String)

class Application @Inject() (ws: WSClient) extends Controller {

  //  Json readers
  implicit val authorReaderFromCommit: Reads[Author] = (
    (__ \ "author" \ "login").readNullable[String] and
    (__ \ "commit" \ "author" \ "name").readNullable[String] and
    (__ \ "commit" \ "author" \ "email").readNullable[String] and
    (__ \ "author" \ "avatar_url").readNullable[String] and
    (__ \ "author" \ "total").readNullable[Int])(Author.apply _)
  implicit val authorReader: Reads[Author] = (
    (__ \ "login").readNullable[String] and
    (__ \ "login").readNullable[String] and
    (__ \ "email").readNullable[String] and
    (__ \ "avatar_url").readNullable[String] and
    (__ \ "total").readNullable[Int])(Author.apply _)

  implicit val commitReader = (
    (__ \ "commit" \ "message").read[String] and
    (__).read[Author](authorReaderFromCommit) and
    (__ \ "commit" \ "author" \ "date").read[String] and
    (__ \ "sha").read[String])(Commit.apply _)

  //Json writers
  implicit val authorToJson = new Writes[Author] {
    def writes(author: Author) = Json.obj(
      "login" -> author.login,
      "name" -> author.name,
      "email" -> author.email,
      "avatar_url" -> author.avatar_url,
      "total" -> Json.toJson(author.total.getOrElse(0)))
  }
  implicit val commitToJson = new Writes[Commit] {
    def writes(commit: Commit) = Json.obj(
      "message" -> commit.message,
      "author" -> commit.author,
      "date" -> commit.date,
      "sha" -> commit.sha)
  }

  //Search Bar
  def index() = Action { implicit request =>
    Ok(views.html.index("GitHub Stats"))
  }

  //Display analysis of a repo
  def repo(name: String) = Action { implicit request =>
    Ok(views.html.index(name + " - GitHubStats"))
  }

  //Get list of commits and total by author
  def commits(repo: String, page: Int) = Action.async { request =>
    val head = request.cookies.get("access_token") match {
      case None               => ("Accept" -> "application/json")
      case Some(access_token) => ("Authorization" -> ("token " + access_token.value))
    }

    //Get all contributors for the first call
    val future_users = page match {
      case 1 => ws.url("https://api.github.com/repos/" + repo + "/contributors?per_page=1000")
        .withHeaders(head).get.map(response => {
          response.json.validate[Seq[Author]](Reads.seq[Author](authorReader)).getOrElse(Nil)
        })
      case _ => Future(Nil)
    }

    //Get 100 last commits
    ws.url("https://api.github.com/repos/" + repo + "/commits?per_page=100&page=" + page)
      .withHeaders(head).get.map(response => {
        if (response.status == 200) {
          val commits = response.json.validate[Seq[Commit]].get;
          val commiters = page match {
            case 1 => commits.groupBy(commit => commit.author.email).mapValues(c_all =>
              Author(
                c_all.flatMap(a => a.author.login).headOption,
                c_all.map(a => a.author.name).head,
                c_all.map(a => a.author.email).head,
                c_all.flatMap(a => a.author.avatar_url).headOption,
                Some(c_all.length))).values
            case _ => Nil
          }

          //Add contributors which are not in last 100 commits
          val users = Await.result(future_users, 20 seconds).filter(a => commiters.find(c => c.login == a.login) == None)
          val authors = commiters ++ users
          Ok(Json.toJson(Map(
            "commits" -> Json.toJson(commits),
            "authors" -> Json.toJson(authors)))).withHeaders(
            "x-ratelimit-remaining" -> response.header("X-RateLimit-Remaining").getOrElse("0"),
            "x-ratelimit-reset" -> response.header("X-RateLimit-Reset").getOrElse("0"))

        } else if (response.status == 401) { //wrong token
          Unauthorized.withCookies(Cookie("access_token", "", Some(0)))
        } else {
          Status(response.status)
        }

      });
  }

  //Ask access_token from gitHub and save it in cookie
  def login(code: String) = Action.async { implicit request =>
    {
      ws.url("https://github.com/login/oauth/access_token").withHeaders("Accept" -> "application/json").post(
        Json.toJson(Map(
          "client_id" -> current.configuration.getString("github.client_id").get, //"023b4b4bb7288038ddc4",
          "client_secret" -> current.configuration.getString("github.client_secret").get, //"43f14fe116ac645011d70711d59fdcc0e09a4bbf",
          "code" -> code)))
        .map(response => {
          Ok(response.json).withCookies(
            Cookie(
              "access_token",
              (response.json \ "access_token").get.toString,
              Some(60 * 60 * 24 * 7),
              httpOnly = true))
        })

    }
  }

}
